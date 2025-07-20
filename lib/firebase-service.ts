/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  onSnapshot,
  QueryConstraint,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "./firebase";
import {
  ProductionEntry,
  TerminalReceipt,
  AllocationResult,
  ReconciliationRun,
  AuditLog,
  User,
  CreateProductionEntryData,
  CreateTerminalReceiptData,
  UserRole,
  Permission,
} from "../types";
import { AllocationEngine } from "./allocation-engine";
import { userDB } from "../constants";

export class FirebaseService {
  private allocationEngine: AllocationEngine;

  constructor() {
    this.allocationEngine = new AllocationEngine();
  }

  // User Management (Note: Client SDK has limited user creation capabilities)
  async createUserInFirestore(userData: {
    email: string;
    role: UserRole;
    password: string;
    permissions: Permission[];
    company: string;
    active: boolean;
  }) {
    try {
      const { email, password, role, permissions, company, active } = userData;

      // Create user in Firebase Auth using client SDK
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      // Save user metadata to Firestore
      const now = new Date();
      const userDocRef = doc(db, userDB, uid);

      await setDoc(userDocRef, {
        email,
        role,
        permissions,
        company,
        active,
        created_at: Timestamp.fromDate(now),
        updated_at: Timestamp.fromDate(now),
        last_login: null,
      });

      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role,
        permissions,
        company,
      };
    } catch (error: any) {
      console.error("Error creating user:", error.message);
      throw new Error(error.message || "User creation failed");
    }
  }

  async loginUser(credentials: { email: string; password: string }) {
    try {
      const { email, password } = credentials;

      // Sign in user with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      // Get user data from Firestore
      const userDocRef = doc(db, userDB, uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("User data not found");
      }

      const userData = userDocSnap.data();

      // Check if user is active
      if (!userData.active) {
        throw new Error("Account is deactivated");
      }

      // Update last login timestamp
      await updateDoc(userDocRef, {
        last_login: Timestamp.fromDate(new Date()),
        updated_at: Timestamp.fromDate(new Date()),
      });

      // Generate JWT token (you'll need to implement this based on your setup)
      const token = await userCredential.user.getIdToken();

      return {
        token,
        userId: uid,
        email: userCredential.user.email,
        role: userData.role,
        permissions: userData.permissions,
        company: userData.company,
      };
    } catch (error: any) {
      console.error("Error logging in user:", error.message);

      // Handle specific Firebase Auth errors
      switch (error.code) {
        case "auth/user-not-found":
          throw new Error("No account found with this email");
        case "auth/wrong-password":
          throw new Error("Incorrect password");
        case "auth/invalid-email":
          throw new Error("Invalid email address");
        case "auth/user-disabled":
          throw new Error("Account has been disabled");
        case "auth/too-many-requests":
          throw new Error("Too many failed attempts. Please try again later");
        default:
          throw new Error(error.message || "Login failed");
      }
    }
  }
  // Authentication methods
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update last login
      const userRef = doc(db, userDB, userCredential.user.uid);
      await updateDoc(userRef, {
        last_login: Timestamp.fromDate(new Date()),
        updated_at: Timestamp.fromDate(new Date()),
      });

      return userCredential.user;
    } catch (error: any) {
      console.error("Error signing in:", error.message);
      throw new Error(error.message || "Sign in failed");
    }
  }

  async signOut() {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Error signing out:", error.message);
      throw new Error(error.message || "Sign out failed");
    }
  }

  // Production Entries
  async createProductionEntry(
    data: CreateProductionEntryData
  ): Promise<string> {
    const now = new Date();
    const hash = this.allocationEngine.generateHash(data);

    const entry: Omit<ProductionEntry, "id"> = {
      ...data,
      hash,
      created_at: now,
      updated_at: now,
    };

    const docRef = await addDoc(collection(db, "production_entries"), {
      ...entry,
      timestamp: Timestamp.fromDate(entry.timestamp),
      created_at: Timestamp.fromDate(entry.created_at),
      updated_at: Timestamp.fromDate(entry.updated_at),
    });

    // Create audit log
    await this.createAuditLog({
      action: "CREATE_PRODUCTION_ENTRY",
      entity_type: "production_entry",
      entity_id: docRef.id,
      user_id: data.created_by,
      user_email: auth.currentUser?.email || "",
      timestamp: now,
      hash: this.allocationEngine.createAuditHash(
        "CREATE_PRODUCTION_ENTRY",
        docRef.id,
        data.created_by,
        now
      ),
    });

    return docRef.id;
  }

  async getProductionEntries(
    partnerId?: string,
    startDate?: Date,
    endDate?: Date,
    limitCount?: number
  ): Promise<ProductionEntry[]> {
    const constraints: QueryConstraint[] = [];

    // Set default dates if not provided
    let effectiveStartDate = startDate;
    let effectiveEndDate = endDate;

    if (!startDate || !endDate) {
      const now = new Date();

      if (!startDate) {
        // First day of current month
        effectiveStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      if (!endDate) {
        // Last day of current month
        effectiveEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    }

    if (partnerId) {
      constraints.push(where("partner", "==", partnerId));
    }

    if (effectiveStartDate) {
      constraints.push(
        where("timestamp", ">=", Timestamp.fromDate(effectiveStartDate))
      );
    }

    if (effectiveEndDate) {
      constraints.push(
        where("timestamp", "<=", Timestamp.fromDate(effectiveEndDate))
      );
    }

    constraints.push(orderBy("timestamp", "desc"));

    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collection(db, "production_entries"), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
          created_at: doc.data().created_at.toDate(),
          updated_at: doc.data().updated_at.toDate(),
        } as ProductionEntry)
    );
  }

  async updateProductionEntry(
    id: string,
    data: Partial<CreateProductionEntryData>
  ): Promise<void> {
    const now = new Date();
    const docRef = doc(db, "production_entries", id);

    const updateData: any = {
      ...data,
      updated_at: Timestamp.fromDate(now),
    };

    if (data.timestamp) {
      updateData.timestamp = Timestamp.fromDate(data.timestamp);
    }

    // Regenerate hash if data is being updated
    if (Object.keys(data).length > 0) {
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists()) {
        const currentData = currentDoc.data();
        const newData = { ...currentData, ...data };
        updateData.hash = this.allocationEngine.generateHash(newData);
      }
    }

    await updateDoc(docRef, updateData);

    // Create audit log
    await this.createAuditLog({
      action: "UPDATE_PRODUCTION_ENTRY",
      entity_type: "production_entry",
      entity_id: id,
      user_id: auth.currentUser?.uid || "",
      user_email: auth.currentUser?.email || "",
      timestamp: now,
      changes: data,
      hash: this.allocationEngine.createAuditHash(
        "UPDATE_PRODUCTION_ENTRY",
        id,
        auth.currentUser?.uid || "",
        now
      ),
    });
  }

  async deleteProductionEntry(id: string): Promise<void> {
    const now = new Date();
    await deleteDoc(doc(db, "production_entries", id));

    // Create audit log
    await this.createAuditLog({
      action: "DELETE_PRODUCTION_ENTRY",
      entity_type: "production_entry",
      entity_id: id,
      user_id: auth.currentUser?.uid || "",
      user_email: auth.currentUser?.email || "",
      timestamp: now,
      hash: this.allocationEngine.createAuditHash(
        "DELETE_PRODUCTION_ENTRY",
        id,
        auth.currentUser?.uid || "",
        now
      ),
    });
  }

  // Terminal Receipts
  async createTerminalReceipt(
    data: CreateTerminalReceiptData
  ): Promise<string> {
    const now = new Date();
    const hash = this.allocationEngine.generateHash(data);

    const receipt: Omit<TerminalReceipt, "id"> = {
      ...data,
      hash,
      created_at: now,
      updated_at: now,
    };

    const docRef = await addDoc(collection(db, "terminal_receipts"), {
      ...receipt,
      timestamp: Timestamp.fromDate(receipt.timestamp),
      created_at: Timestamp.fromDate(receipt.created_at),
      updated_at: Timestamp.fromDate(receipt.updated_at),
    });

    await this.createAuditLog({
      action: "CREATE_TERMINAL_RECEIPT",
      entity_type: "terminal_receipt",
      entity_id: docRef.id,
      user_id: data.created_by,
      user_email: auth.currentUser?.email || "",
      timestamp: now,
      hash: this.allocationEngine.createAuditHash(
        "CREATE_TERMINAL_RECEIPT",
        docRef.id,
        data.created_by,
        now
      ),
    });

    return docRef.id;
  }

  async getTerminalReceipts(
    startDate?: Date,
    endDate?: Date,
    limitCount?: number
  ): Promise<TerminalReceipt[]> {
    const constraints: QueryConstraint[] = [];

    if (startDate) {
      constraints.push(where("timestamp", ">=", Timestamp.fromDate(startDate)));
    }

    if (endDate) {
      constraints.push(where("timestamp", "<=", Timestamp.fromDate(endDate)));
    }

    constraints.push(orderBy("timestamp", "desc"));

    if (limitCount) {
      constraints.push(limit(limitCount));
    }

    const q = query(collection(db, "terminal_receipts"), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
          created_at: doc.data().created_at.toDate(),
          updated_at: doc.data().updated_at.toDate(),
        } as TerminalReceipt)
    );
  }

  async updateTerminalReceipt(
    id: string,
    data: Partial<CreateTerminalReceiptData>
  ): Promise<void> {
    const now = new Date();
    const docRef = doc(db, "terminal_receipts", id);

    const updateData: any = {
      ...data,
      updated_at: Timestamp.fromDate(now),
    };

    if (data.timestamp) {
      updateData.timestamp = Timestamp.fromDate(data.timestamp);
    }

    if (Object.keys(data).length > 0) {
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists()) {
        const currentData = currentDoc.data();
        const newData = { ...currentData, ...data };
        updateData.hash = this.allocationEngine.generateHash(newData);
      }
    }

    await updateDoc(docRef, updateData);

    await this.createAuditLog({
      action: "UPDATE_TERMINAL_RECEIPT",
      entity_type: "terminal_receipt",
      entity_id: id,
      user_id: auth.currentUser?.uid || "",
      user_email: auth.currentUser?.email || "",
      timestamp: now,
      changes: data,
      hash: this.allocationEngine.createAuditHash(
        "UPDATE_TERMINAL_RECEIPT",
        id,
        auth.currentUser?.uid || "",
        now
      ),
    });
  }

  async deleteTerminalReceipt(id: string): Promise<void> {
    const now = new Date();
    await deleteDoc(doc(db, "terminal_receipts", id));

    await this.createAuditLog({
      action: "DELETE_TERMINAL_RECEIPT",
      entity_type: "terminal_receipt",
      entity_id: id,
      user_id: auth.currentUser?.uid || "",
      user_email: auth.currentUser?.email || "",
      timestamp: now,
      hash: this.allocationEngine.createAuditHash(
        "DELETE_TERMINAL_RECEIPT",
        id,
        auth.currentUser?.uid || "",
        now
      ),
    });
  }

  // Reconciliation
  async triggerReconciliation(
    productionDate: Date,
    triggeredBy: string
  ): Promise<string> {
    const batch = writeBatch(db);
    const now = new Date();

    // Get production entries for the date
    const startOfDay = new Date(productionDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(productionDate);
    endOfDay.setHours(23, 59, 59, 999);

    const productionEntries = await this.getProductionEntries(
      undefined,
      startOfDay,
      endOfDay
    );

    if (productionEntries.length === 0) {
      throw new Error("No production entries found for the specified date");
    }

    // Get terminal receipt for the date
    const terminalReceipts = await this.getTerminalReceipts(
      startOfDay,
      endOfDay,
      1
    );

    if (terminalReceipts.length === 0) {
      throw new Error("No terminal receipt found for the specified date");
    }

    const terminalReceipt = terminalReceipts[0];

    // Calculate allocation
    const allocationInputs = productionEntries.map((entry) => ({
      partner: entry.partner,
      gross_volume_bbl: entry.gross_volume_bbl,
      bsw_percent: entry.bsw_percent,
      temperature_degF: entry.temperature_degF,
      pressure_psi: entry.pressure_psi,
    }));

    const allocationResult = this.allocationEngine.calculateAllocation(
      allocationInputs,
      { final_volume_bbl: terminalReceipt.final_volume_bbl }
    );

    // Create reconciliation run
    const reconciliationRef = doc(collection(db, "reconciliation_runs"));
    const reconciliationId = reconciliationRef.id;

    const reconciliationRun: Omit<ReconciliationRun, "id"> = {
      total_terminal_volume: allocationResult.total_terminal_volume,
      total_input_volume: allocationResult.total_input_volume,
      total_net_volume: allocationResult.total_net_volume,
      shrinkage_factor: allocationResult.shrinkage_factor,
      timestamp: productionDate,
      status: "completed",
      triggered_by: triggeredBy,
      created_at: now,
      hash: this.allocationEngine.generateHash({
        ...allocationResult,
        timestamp: productionDate.toISOString(),
        triggered_by: triggeredBy,
      }),
    };

    batch.set(reconciliationRef, {
      ...reconciliationRun,
      timestamp: Timestamp.fromDate(reconciliationRun.timestamp),
      created_at: Timestamp.fromDate(reconciliationRun.created_at),
    });

    // Create allocation results
    for (const result of allocationResult.allocation_results) {
      const allocationDoc: Omit<AllocationResult, "id"> = {
        partner: result.partner,
        input_volume: result.input_volume,
        net_volume: result.net_volume,
        allocated_volume: result.allocated_volume,
        percentage: result.percentage,
        timestamp: productionDate,
        reconciliation_id: reconciliationId,
        created_at: now,
        hash: this.allocationEngine.generateHash(result),
      };

      const allocRef = doc(collection(db, "allocation_results"));
      batch.set(allocRef, {
        ...allocationDoc,
        timestamp: Timestamp.fromDate(allocationDoc.timestamp),
        created_at: Timestamp.fromDate(allocationDoc.created_at),
      });
    }

    // Create audit log
    const auditRef = doc(collection(db, "audit_logs"));
    batch.set(auditRef, {
      action: "TRIGGER_RECONCILIATION",
      entity_type: "reconciliation_run",
      entity_id: reconciliationId,
      user_id: triggeredBy,
      user_email: auth.currentUser?.email || "",
      timestamp: Timestamp.fromDate(now),
      hash: this.allocationEngine.createAuditHash(
        "TRIGGER_RECONCILIATION",
        reconciliationId,
        triggeredBy,
        now
      ),
      changes: { production_date: productionDate.toISOString() },
    });

    await batch.commit();
    return reconciliationId;
  }

  // Get reconciliation runs
  async getReconciliationRuns(
    startDate?: Date,
    endDate?: Date,
    limitCount: number = 50
  ): Promise<ReconciliationRun[]> {
    const constraints: QueryConstraint[] = [];

    if (startDate) {
      constraints.push(where("timestamp", ">=", Timestamp.fromDate(startDate)));
    }

    if (endDate) {
      constraints.push(where("timestamp", "<=", Timestamp.fromDate(endDate)));
    }

    constraints.push(orderBy("created_at", "desc"));
    constraints.push(limit(limitCount));

    const q = query(collection(db, "reconciliation_runs"), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
          created_at: doc.data().created_at.toDate(),
        } as ReconciliationRun)
    );
  }

  // Audit Logs
  private async createAuditLog(logData: Omit<AuditLog, "id">): Promise<void> {
    await addDoc(collection(db, "audit_logs"), {
      ...logData,
      timestamp: Timestamp.fromDate(logData.timestamp),
    });
  }

  async getAuditLogs(
    entityType?: string,
    entityId?: string,
    userId?: string,
    limitCount: number = 100
  ): Promise<AuditLog[]> {
    const constraints: QueryConstraint[] = [];

    if (entityType) {
      constraints.push(where("entity_type", "==", entityType));
    }

    if (entityId) {
      constraints.push(where("entity_id", "==", entityId));
    }

    if (userId) {
      constraints.push(where("user_id", "==", userId));
    }

    constraints.push(orderBy("timestamp", "desc"));
    constraints.push(limit(limitCount));

    const q = query(collection(db, "audit_logs"), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
        } as AuditLog)
    );
  }

  /**
   * Get a user by their Firebase UID
   */
  async getUserById(uid: string): Promise<User | unknown | null> {
    const userDoc = await getDoc(doc(db, userDB, uid));
    if (!userDoc.exists()) {
      return null;
    }
    return {
      id: userDoc.id,
      ...userDoc.data(),
    } as unknown;
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<User | unknown | null> {
    if (!auth.currentUser) return null;
    return this.getUserById(auth.currentUser.uid);
  }

  /**
   * Get allocation results, optionally filtered by partner ID
   */
  async getAllocationResults(partnerId?: string): Promise<AllocationResult[]> {
    const constraints: QueryConstraint[] = [orderBy("timestamp", "desc")];
    if (partnerId) {
      constraints.unshift(where("partner", "==", partnerId));
    }
    const q = query(collection(db, "allocation_results"), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
          created_at: doc.data().created_at.toDate(),
        } as AllocationResult)
    );
  }

  // Real-time subscriptions
  subscribeToProductionEntries(
    callback: (entries: ProductionEntry[]) => void,
    partnerId?: string
  ): () => void {
    const constraints: QueryConstraint[] = [
      orderBy("timestamp", "desc"),
      limit(50),
    ];

    if (partnerId) {
      constraints.unshift(where("partner", "==", partnerId));
    }

    const q = query(collection(db, "production_entries"), ...constraints);

    return onSnapshot(q, (querySnapshot) => {
      const entries = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
            created_at: doc.data().created_at.toDate(),
            updated_at: doc.data().updated_at.toDate(),
          } as ProductionEntry)
      );

      callback(entries);
    });
  }

  subscribeToTerminalReceipts(
    callback: (receipts: TerminalReceipt[]) => void
  ): () => void {
    const q = query(
      collection(db, "terminal_receipts"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    return onSnapshot(q, (querySnapshot) => {
      const receipts = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
            created_at: doc.data().created_at.toDate(),
            updated_at: doc.data().updated_at.toDate(),
          } as TerminalReceipt)
      );

      callback(receipts);
    });
  }

  subscribeToAllocationResults(
    callback: (results: AllocationResult[]) => void,
    partnerId?: string
  ): () => void {
    const constraints: QueryConstraint[] = [
      orderBy("timestamp", "desc"),
      limit(50),
    ];

    if (partnerId) {
      constraints.unshift(where("partner", "==", partnerId));
    }

    const q = query(collection(db, "allocation_results"), ...constraints);

    return onSnapshot(q, (querySnapshot) => {
      const results = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
            created_at: doc.data().created_at.toDate(),
          } as AllocationResult)
      );

      callback(results);
    });
  }

  subscribeToReconciliationRuns(
    callback: (runs: ReconciliationRun[]) => void
  ): () => void {
    const q = query(
      collection(db, "reconciliation_runs"),
      orderBy("created_at", "desc"),
      limit(50)
    );

    return onSnapshot(q, (querySnapshot) => {
      const runs = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
            created_at: doc.data().created_at.toDate(),
          } as ReconciliationRun)
      );

      callback(runs);
    });
  }

  subscribeToAuditLogs(
    callback: (logs: AuditLog[]) => void,
    entityType?: string,
    entityId?: string
  ): () => void {
    const constraints: QueryConstraint[] = [
      orderBy("timestamp", "desc"),
      limit(100),
    ];

    if (entityType) {
      constraints.unshift(where("entity_type", "==", entityType));
    }

    if (entityId) {
      constraints.unshift(where("entity_id", "==", entityId));
    }

    const q = query(collection(db, "audit_logs"), ...constraints);

    return onSnapshot(q, (querySnapshot) => {
      const logs = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
          } as AuditLog)
      );

      callback(logs);
    });
  }
}
export const firebaseService = new FirebaseService();
