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
  startAfter,
  getCountFromServer,
  endBefore,
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
import { calculateAllocations, sendNotification } from "./agents-api";

export class FirebaseService {
  private allocationEngine: AllocationEngine;
  private static instance: FirebaseService;

  constructor() {
    this.allocationEngine = new AllocationEngine();
  }

  // Singleton pattern for consistent service usage
  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // Enhanced error handling wrapper
  private handleFirebaseError(error: any, operation: string): never {
    console.error(`Firebase ${operation} error:`, error);

    // Enhanced error messages for better UX
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
      case "auth/email-already-in-use":
        throw new Error("An account with this email already exists");
      case "auth/operation-not-allowed":
        throw new Error("Email/password accounts are not enabled");
      case "auth/weak-password":
        throw new Error(
          "Password is too weak. Please choose a stronger password"
        );
      case "auth/network-request-failed":
        throw new Error("Network error. Please check your connection");
      case "permission-denied":
        throw new Error("You don't have permission to perform this action");
      case "unavailable":
        throw new Error("Service temporarily unavailable. Please try again");
      case "deadline-exceeded":
        throw new Error("Request timed out. Please check your connection");
      case "resource-exhausted":
        throw new Error(
          "Too many requests. Please wait a moment and try again"
        );
      case "unauthenticated":
        throw new Error("Authentication required. Please sign in again");
      default:
        throw new Error(error.message || `${operation} failed`);
    }
  }

  // Enhanced user creation with better validation
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

      // Input validation
      if (!email || !password || !company.trim()) {
        throw new Error("Email, password, and company are required");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

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
        company: company.trim(),
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
        company: company.trim(),
      };
    } catch (error: any) {
      this.handleFirebaseError(error, "User Creation");
    }
  }

  async loginUser(credentials: { email: string; password: string }) {
    try {
      const { email, password } = credentials;

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

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
        throw new Error(
          "User profile not found. Please contact administrator."
        );
      }

      const userData = userDocSnap.data();

      // Check if user is active
      if (!userData.active) {
        throw new Error(
          "Account is deactivated. Please contact administrator."
        );
      }

      // Update last login timestamp
      await updateDoc(userDocRef, {
        last_login: Timestamp.fromDate(new Date()),
        updated_at: Timestamp.fromDate(new Date()),
      });

      // Generate JWT token
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
      this.handleFirebaseError(error, "Login");
    }
  }

  // Enhanced authentication methods
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
      this.handleFirebaseError(error, "Sign In");
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      // Clear localStorage on sign out
      localStorage.removeItem("user");
    } catch (error: any) {
      this.handleFirebaseError(error, "Sign Out");
    }
  }

  // Enhanced production entries with validation
  async createProductionEntry(
    data: CreateProductionEntryData
  ): Promise<string> {
    try {
      // Validate input data using allocation engine
      const validationErrors = this.allocationEngine.validateInputs([
        {
          partner: data.partner,
          gross_volume_bbl: data.gross_volume_bbl,
          bsw_percent: data.bsw_percent,
          temperature_degF: data.temperature_degF,
          api_gravity: data.api_gravity,
        },
      ]);

      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
      }

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
    } catch (error: any) {
      this.handleFirebaseError(error, "Production Entry Creation");
    }
  }
  // Add this new method to your FirebaseService class
  async getAllProductionEntriesForPeriod(
    partnerId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ProductionEntry[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (partnerId) {
        constraints.push(where("partner", "==", partnerId));
      }

      if (startDate) {
        constraints.push(
          where("timestamp", ">=", Timestamp.fromDate(startDate))
        );
      }

      if (endDate) {
        constraints.push(where("timestamp", "<=", Timestamp.fromDate(endDate)));
      }

      constraints.push(orderBy("timestamp", "desc"));

      // No limit - get ALL entries for the period
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
    } catch (error: any) {
      this.handleFirebaseError(error, "All Production Entries Retrieval");
      return [];
    }
  }

  async getProductionEntries(
    partnerId?: string,
    startDate?: Date,
    endDate?: Date,
    limitPerPage: number = 31,
    lastVisible?: Timestamp,
    direction: "next" | "previous" = "next"
  ): Promise<{
    data: ProductionEntry[];
    lastVisible: Timestamp | null;
    firstVisible: Timestamp | null;
    total: number;
  }> {
    try {
      const constraints: QueryConstraint[] = [];

      let effectiveStartDate = startDate;
      let effectiveEndDate = endDate;

      if (!startDate || !endDate) {
        const now = new Date();
        if (!startDate)
          effectiveStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        if (!endDate)
          effectiveEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
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

      // Get total count (without pagination)
      const countQuery = query(
        collection(db, "production_entries"),
        ...constraints
      );
      const snapshot = await getCountFromServer(countQuery);
      const total = snapshot.data().count;

      // FIXED: Always order by timestamp desc for consistent pagination
      constraints.push(orderBy("timestamp", "desc"));

      // FIXED: Handle pagination cursors properly
      if (lastVisible) {
        if (direction === "previous") {
          // For previous, we need to get items BEFORE the first item of current page
          // Use endBefore with the firstVisible timestamp from current page
          constraints.push(endBefore(lastVisible));
        } else {
          // For next, get items AFTER the last item of current page
          constraints.push(startAfter(lastVisible));
        }
      }

      constraints.push(limit(limitPerPage));

      const q = query(collection(db, "production_entries"), ...constraints);
      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
            created_at: doc.data().created_at.toDate(),
            updated_at: doc.data().updated_at.toDate(),
          } as ProductionEntry)
      );

      // Get the timestamps for pagination cursors
      const lastVisibleTimestamp =
        querySnapshot.docs.length > 0
          ? (querySnapshot.docs[querySnapshot.docs.length - 1].data() as any)
              .timestamp
          : null;

      const firstVisibleTimestamp =
        querySnapshot.docs.length > 0
          ? (querySnapshot.docs[0].data() as any).timestamp
          : null;

      return {
        data,
        lastVisible: lastVisibleTimestamp,
        firstVisible: firstVisibleTimestamp,
        total,
      };
    } catch (error: any) {
      this.handleFirebaseError(error, "Production Entries Retrieval");
      return { data: [], lastVisible: null, firstVisible: null, total: 0 };
    }
  }
  async updateProductionEntry(
    id: string,
    data: Partial<CreateProductionEntryData>
  ): Promise<void> {
    try {
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
    } catch (error: any) {
      this.handleFirebaseError(error, "Production Entry Update");
    }
  }

  async deleteProductionEntry(id: string): Promise<void> {
    try {
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
    } catch (error: any) {
      this.handleFirebaseError(error, "Production Entry Deletion");
    }
  }

  // Terminal Receipts
  async createTerminalReceipt(
    data: CreateTerminalReceiptData
  ): Promise<string> {
    try {
      // Validate input data
      if (!data.timestamp || !data.created_by) {
        throw new Error("Timestamp and created_by are required fields");
      }

      // Extract year and month from the provided timestamp
      const inputDate = new Date(data.timestamp);
      const inputYear = inputDate.getFullYear();
      const inputMonth = inputDate.getMonth(); // 0-indexed (0 = January, 11 = December)

      // Create date range for the entire month
      const monthStart = new Date(inputYear, inputMonth, 1); // First day of month
      const monthEnd = new Date(inputYear, inputMonth + 1, 0); // Last day of month
      monthEnd.setHours(23, 59, 59, 999); // End of day

      // Check if any terminal receipt already exists for this month
      const existingReceiptsQuery = query(
        collection(db, "terminal_receipts"),
        where("timestamp", ">=", Timestamp.fromDate(monthStart)),
        where("timestamp", "<=", Timestamp.fromDate(monthEnd)),
        limit(1) // We only need to know if any exists
      );

      const existingReceiptsSnapshot = await getDocs(existingReceiptsQuery);

      if (!existingReceiptsSnapshot.empty) {
        const existingReceipt = existingReceiptsSnapshot.docs[0];
        const existingData = existingReceipt.data();
        const existingDate = existingData.timestamp.toDate();

        const monthName = inputDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });

        throw new Error(
          `Terminal receipt already exists for ${monthName}. ` +
            `Existing receipt created on ${existingDate.toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )} with ID: ${existingReceipt.id}`
        );
      }

      // Validate terminal volumes against partner production
      const productionEntries = await this.getAllProductionEntriesForPeriod(
        undefined,
        monthStart,
        monthEnd
      );

      if (productionEntries && productionEntries.length > 0) {
        // Calculate total partner gross volume
        const totalPartnerGrossVolume = productionEntries.reduce(
          (sum, entry) => sum + entry.gross_volume_bbl,
          0
        );

        // Check initial volume
        if (data.initial_volume_bbl > totalPartnerGrossVolume) {
          throw new Error(
            `Terminal initial volume (${data.initial_volume_bbl.toLocaleString()} BBL) exceeds total partner production (${totalPartnerGrossVolume.toLocaleString()} BBL). ` +
            `Please adjust the initial volume to be ${totalPartnerGrossVolume.toLocaleString()} BBL or less.`
          );
        }

        // Check final volume
        if (data.final_volume_bbl > totalPartnerGrossVolume) {
          throw new Error(
            `Terminal final volume (${data.final_volume_bbl.toLocaleString()} BBL) exceeds total partner production (${totalPartnerGrossVolume.toLocaleString()} BBL). ` +
            `Please adjust the final volume to be ${totalPartnerGrossVolume.toLocaleString()} BBL or less.`
          );
        }
      }

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

      // Automatically trigger reconciliation for this month
      try {
        console.log(`🚀 Auto-triggering reconciliation for ${inputDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}...`);

        const reconciliationId = await this.triggerReconciliation(
          monthStart,
          monthEnd,
          data.created_by
        );

        console.log(`✅ Automatic reconciliation completed! ID: ${reconciliationId}`);
      } catch (reconciliationError: any) {
        console.error(`⚠️ Automatic reconciliation failed: ${reconciliationError.message}`);
        // Don't fail the terminal receipt creation if reconciliation fails
        // Log it but continue
        console.log('Terminal receipt created successfully, but reconciliation needs to be run manually');
      }

      return docRef.id;
    } catch (error: any) {
      this.handleFirebaseError(error, "Terminal Receipt Creation");
    }
  }

  async getTerminalReceipts(
    startDate?: Date,
    endDate?: Date,
    limitCount?: number
  ): Promise<TerminalReceipt[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (startDate) {
        constraints.push(
          where("timestamp", ">=", Timestamp.fromDate(startDate))
        );
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
    } catch (error: any) {
      this.handleFirebaseError(error, "Terminal Receipts Retrieval");
    }
  }

  async updateTerminalReceipt(
    id: string,
    data: Partial<CreateTerminalReceiptData>
  ): Promise<void> {
    try {
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
    } catch (error: any) {
      this.handleFirebaseError(error, "Terminal Receipt Update");
    }
  }

  async deleteTerminalReceipt(id: string): Promise<void> {
    try {
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
    } catch (error: any) {
      this.handleFirebaseError(error, "Terminal Receipt Deletion");
    }
  }

  async triggerReconciliation(
    startDate: Date,
    endDate: Date,
    triggeredBy: string
  ): Promise<string> {
    try {
      if (!startDate || !endDate || !triggeredBy) {
        throw new Error(
          "Start date, end date, and triggered by user are required"
        );
      }

      // Validate date range
      if (startDate >= endDate) {
        throw new Error("Start date must be before end date");
      }

      // Set proper time boundaries
      const periodStartDate = new Date(startDate);
      periodStartDate.setHours(0, 0, 0, 0);

      const periodEndDate = new Date(endDate);
      periodEndDate.setHours(23, 59, 59, 999);

      // Check if reconciliation already exists for this period
      const existingReconciliations = await this.getReconciliationRuns(
        periodStartDate,
        periodEndDate
      );

      if (existingReconciliations.length > 0) {
        const existingRun = existingReconciliations[0];
        const formatDate = (date: Date) => date.toLocaleDateString();

        throw new Error(
          `Reconciliation already done for the period ${formatDate(
            periodStartDate
          )} to ${formatDate(periodEndDate)}. ` +
            `Existing reconciliation ID: ${existingRun.id} (${formatDate(
              existingRun.timestamp
            )})`
        );
      }
      const batch = writeBatch(db);
      const now = new Date();

      // Get production entries for the entire period
      const [productionEntries, terminalReceipts] = await Promise.all([
        this.getAllProductionEntriesForPeriod(
          undefined,
          periodStartDate,
          periodEndDate
        ),
        this.getTerminalReceipts(periodStartDate, periodEndDate),
      ]);

      if (productionEntries && productionEntries.length === 0) {
        throw new Error(
          `No production entries found for the period ${periodStartDate.toLocaleDateString()} to ${periodEndDate.toLocaleDateString()}`
        );
      }

      if (terminalReceipts.length === 0) {
        throw new Error(
          `No terminal receipts found for the period ${periodStartDate.toLocaleDateString()} to ${periodEndDate.toLocaleDateString()}`
        );
      }

      // Calculate total terminal volume for the period (this is what we're distributing)
      const totalTerminalVolume = terminalReceipts.reduce(
        (sum, receipt) => sum + receipt.final_volume_bbl,
        0
      );

      // Calculate weighted average terminal API gravity
      const weightedAPIGravity =
        terminalReceipts.reduce(
          (sum, receipt) =>
            (sum + (receipt.api_gravity as number)) * receipt.final_volume_bbl,
          0
        ) / totalTerminalVolume;

      // ===========================================
      // PARTNER AGGREGATION LOGIC
      // ===========================================
      console.log(`📊 Aggregating ${productionEntries.length} production entries by partner...`);

      // Group production entries by partner and calculate weighted averages
      const partnerAggregates = new Map<string, {
        partner: string;
        total_gross_volume: number;
        weighted_bsw_sum: number;
        weighted_temp_sum: number;
        weighted_api_sum: number;
        entry_count: number;
      }>();

      // Aggregate all production data by partner
      productionEntries.forEach(entry => {
        const existing = partnerAggregates.get(entry.partner) || {
          partner: entry.partner,
          total_gross_volume: 0,
          weighted_bsw_sum: 0,
          weighted_temp_sum: 0,
          weighted_api_sum: 0,
          entry_count: 0,
        };

        // Sum gross volumes
        existing.total_gross_volume += entry.gross_volume_bbl;

        // Calculate weighted sums (weighted by gross volume for accurate averaging)
        existing.weighted_bsw_sum += entry.bsw_percent * entry.gross_volume_bbl;
        existing.weighted_temp_sum += entry.temperature_degF * entry.gross_volume_bbl;
        existing.weighted_api_sum += entry.api_gravity * entry.gross_volume_bbl;
        existing.entry_count += 1;

        partnerAggregates.set(entry.partner, existing);
      });

      // Calculate weighted averages for each partner
      const aggregatedProduction = Array.from(partnerAggregates.values()).map(agg => ({
        partner: agg.partner,
        gross_volume_bbl: agg.total_gross_volume,
        bsw_percent: agg.weighted_bsw_sum / agg.total_gross_volume,
        temperature_degF: agg.weighted_temp_sum / agg.total_gross_volume,
        api_gravity: agg.weighted_api_sum / agg.total_gross_volume,
      }));

      console.log(`✅ Aggregated ${aggregatedProduction.length} partners from ${productionEntries.length} entries`);
      aggregatedProduction.forEach(partner => {
        console.log(`  - ${partner.partner}: ${partner.gross_volume_bbl.toLocaleString()} bbl (BSW: ${partner.bsw_percent.toFixed(2)}%, Temp: ${partner.temperature_degF.toFixed(1)}°F, API: ${partner.api_gravity.toFixed(2)}°)`);
      });

      // ===========================================
      // ACCOUNTANT AGENT INTEGRATION
      // ===========================================
      console.log("🤖 Calling Accountant Agent for allocation calculations...");

      // Create temporary reconciliation ID for the request
      const tempReconciliationId = `temp_${Date.now()}`;

      let allocationResults: Array<{
        partner: string;
        input_volume: number;
        net_volume: number;
        allocated_volume: number;
        percentage: number;
        volume_loss: number;
      }> = [];

      let totalGrossVolumeAllPartners = 0;
      let totalCorrectedVolume = 0;
      let shrinkageFactor = 0;

      try {
        // Call Accountant Agent with AGGREGATED production data (one entry per partner)
        const agentAllocations = await calculateAllocations({
          receipt_id: tempReconciliationId,
          receipt_data: {
            terminal_volume_bbl: totalTerminalVolume,
            api_gravity: weightedAPIGravity,
            production_entries: aggregatedProduction,
          },
        });

        console.log(`✅ Accountant Agent returned ${agentAllocations.length} allocations`);

        // Map agent results to our expected format
        allocationResults = agentAllocations.map((result) => ({
          partner: result.partner,
          input_volume: result.gross_volume,
          net_volume: result.net_volume,
          allocated_volume: result.allocated_volume,
          percentage: result.percentage,
          volume_loss: result.volume_loss,
        }));

        // Calculate totals from agent results
        totalGrossVolumeAllPartners = allocationResults.reduce(
          (sum, result) => sum + result.input_volume,
          0
        );

        totalCorrectedVolume = allocationResults.reduce(
          (sum, result) => sum + result.net_volume,
          0
        );

        shrinkageFactor =
          totalCorrectedVolume > 0
            ? ((totalCorrectedVolume - totalTerminalVolume) /
                totalCorrectedVolume) *
              100
            : 0;

        // Log final results for debugging
        console.log("=== ACCOUNTANT AGENT ALLOCATION RESULTS ===");
        allocationResults.forEach((result) => {
          const efficiency =
            (result.allocated_volume / result.input_volume) * 100;
          console.log(
            `${result.partner}: ${efficiency.toFixed(
              3
            )}% efficiency (${result.allocated_volume.toLocaleString()} / ${result.input_volume.toLocaleString()})`
          );
        });
      } catch (agentError) {
        console.error("❌ Error calling Accountant Agent:", agentError);
        console.log("⚠️ Falling back to local allocation engine...");

        // Fallback to local calculation if agent fails
        // [Original calculation code would go here as fallback]
        throw new Error(
          `Accountant Agent failed: ${agentError}. Please ensure the agent is running and try again.`
        );
      }

      // Create reconciliation run with period information
      const reconciliationRef = doc(collection(db, "reconciliation_runs"));
      const reconciliationId = reconciliationRef.id;

      // Calculate total allocated volume and total volume loss from allocation results
      const totalAllocatedVolume = allocationResults.reduce(
        (sum, result) => sum + result.allocated_volume,
        0
      );
      const totalVolumeLoss = allocationResults.reduce(
        (sum, result) => sum + (result.volume_loss || 0),
        0
      );

      const reconciliationRun: Omit<ReconciliationRun, "id"> = {
        total_terminal_volume: Math.round(totalTerminalVolume * 100) / 100,
        total_input_volume: Math.round(totalGrossVolumeAllPartners * 100) / 100,
        total_net_volume: Math.round(totalCorrectedVolume * 100) / 100,
        total_allocated_volume: Math.round(totalAllocatedVolume * 100) / 100,
        total_volume_loss: Math.round(totalVolumeLoss * 100) / 100,
        shrinkage_factor: Math.round(shrinkageFactor * 100) / 100,
        start_date: periodStartDate,
        end_date: periodEndDate,
        timestamp: now,
        status: "completed",
        triggered_by: triggeredBy,
        created_at: now,
        hash: this.allocationEngine.generateHash({
          total_terminal_volume: totalTerminalVolume,
          total_input_volume: totalGrossVolumeAllPartners,
          total_net_volume: totalCorrectedVolume,
          total_allocated_volume: totalAllocatedVolume,
          total_volume_loss: totalVolumeLoss,
          shrinkage_factor: shrinkageFactor,
          start_date: periodStartDate.toISOString(),
          end_date: periodEndDate.toISOString(),
          triggered_by: triggeredBy,
        }),
      };

      batch.set(reconciliationRef, {
        ...reconciliationRun,
        start_date: Timestamp.fromDate(reconciliationRun.start_date as Date),
        end_date: Timestamp.fromDate(reconciliationRun.end_date as Date),
        timestamp: Timestamp.fromDate(reconciliationRun.timestamp),
        created_at: Timestamp.fromDate(reconciliationRun.created_at),
      });

      // Create allocation results for each partner
      for (const result of allocationResults) {
        const allocationDoc: Omit<AllocationResult, "id"> = {
          partner: result.partner,
          input_volume: result.input_volume,
          net_volume: result.net_volume,
          allocated_volume: result.allocated_volume,
          percentage: result.percentage,
          volume_loss: result.volume_loss,
          start_date: periodStartDate,
          end_date: periodEndDate,
          timestamp: periodEndDate,
          reconciliation_id: reconciliationId,
          created_at: now,
          hash: this.allocationEngine.generateHash(result),
        };

        const allocRef = doc(collection(db, "allocation_results"));
        batch.set(allocRef, {
          ...allocationDoc,
          start_date: Timestamp.fromDate(allocationDoc.start_date as Date),
          end_date: Timestamp.fromDate(allocationDoc.end_date as Date),
          timestamp: Timestamp.fromDate(allocationDoc.timestamp as Date),
          created_at: Timestamp.fromDate(allocationDoc.created_at as Date),
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
        changes: {
          reconciliation_period: `${periodStartDate.toISOString()} to ${periodEndDate.toISOString()}`,
          partners_count: allocationResults.length,
          total_input_volume: totalGrossVolumeAllPartners,
          actual_terminal_volume: totalTerminalVolume,
          shrinkage_factor: shrinkageFactor,
          terminal_receipts_count: terminalReceipts.length,
          production_entries_count: productionEntries.length,
        },
      });

      await batch.commit();

      // ===========================================
      // COMMUNICATOR AGENT INTEGRATION
      // ===========================================
      console.log("🤖 Calling Communicator Agent to send notifications...");

      try {
        // Send notification to all partners about new reconciliation
        // Using real email for testing - all notifications go to todak2000@gmail.com
        const partnerEmails = 'todak2000@gmail.com';

        // Format period for subject line (e.g., "October 2025")
        const periodMonth = periodStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        await sendNotification({
          notification_id: `notif_${reconciliationId}`,
          notification_data: {
            type: 'email',
            recipient: partnerEmails,
            subject: `✅ ${periodMonth} Reconciliation Report Available`,
            body: `Reconciliation report for ${periodMonth}`, // Required by Pydantic
            metadata: {
              reconciliation_id: reconciliationId,
              period_start: periodStartDate.toISOString(),
              period_end: periodEndDate.toISOString(),
              reconciliation_data: {
                period_start: periodStartDate.toLocaleDateString(),
                period_end: periodEndDate.toLocaleDateString(),
                period_month: periodMonth,
                allocations_count: allocationResults.length,
                total_input_volume: totalGrossVolumeAllPartners,
                terminal_volume: totalTerminalVolume,
                shrinkage_factor: shrinkageFactor,
                partners: allocationResults.map(r => r.partner).join(', '),
                allocations: allocationResults.map(r => ({
                  partner: r.partner,
                  input_volume: r.input_volume,
                  allocated_volume: r.allocated_volume,
                  volume_loss: r.volume_loss || 0,
                  percentage: r.percentage,
                })),
              },
            },
          },
        });

        console.log("✅ Communicator Agent notification sent successfully");
      } catch (notificationError) {
        console.error("❌ Error sending notification via Communicator Agent:", notificationError);
        // Don't fail the reconciliation if notification fails
        console.log("⚠️ Reconciliation completed successfully but notification failed");
      }

      return reconciliationId;
    } catch (error: any) {
      this.handleFirebaseError(error, "Reconciliation");
    }
  }
  // Updated method to check for existing reconciliations in a period
  async checkExistingReconciliation(
    startDate: Date,
    endDate: Date
  ): Promise<{
    exists: boolean;
    reconciliation?: ReconciliationRun;
    message?: string;
  }> {
    try {
      const periodStartDate = new Date(startDate);
      periodStartDate.setHours(0, 0, 0, 0);

      const periodEndDate = new Date(endDate);
      periodEndDate.setHours(23, 59, 59, 999);

      const existingReconciliations = await this.getReconciliationRuns(
        periodStartDate,
        periodEndDate
      );

      if (existingReconciliations.length > 0) {
        const existing = existingReconciliations[0];
        return {
          exists: true,
          reconciliation: existing,
          message: `Reconciliation already exists for period ${periodStartDate.toLocaleDateString()} to ${periodEndDate.toLocaleDateString()}`,
        };
      }

      return { exists: false };
    } catch (error: any) {
      this.handleFirebaseError(error, "Check Existing Reconciliation");
    }
  }

  // Helper method to get reconciliation summary for a period
  async getReconciliationSummaryForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<{
    periodStart: Date;
    periodEnd: Date;
    totalProductionEntries: number;
    totalTerminalReceipts: number;
    partnersInvolved: string[];
    readyForReconciliation: boolean;
    issues: string[];
  }> {
    try {
      const periodStartDate = new Date(startDate);
      periodStartDate.setHours(0, 0, 0, 0);

      const periodEndDate = new Date(endDate);
      periodEndDate.setHours(23, 59, 59, 999);

      const [productionEntries, terminalReceipts] = await Promise.all([
        this.getAllProductionEntriesForPeriod(
          undefined,
          periodStartDate,
          periodEndDate
        ),
        this.getTerminalReceipts(periodStartDate, periodEndDate),
      ]);

      const partnersInvolved = [
        ...new Set(productionEntries.map((entry) => entry.partner)),
      ];
      const issues: string[] = [];

      if (productionEntries.length === 0) {
        issues.push("No production entries found for this period");
      }

      if (terminalReceipts.length === 0) {
        issues.push("No terminal receipts found for this period");
      }

      if (partnersInvolved.length === 0) {
        issues.push("No partners have production data for this period");
      }

      return {
        periodStart: periodStartDate,
        periodEnd: periodEndDate,
        totalProductionEntries: productionEntries.length,
        totalTerminalReceipts: terminalReceipts.length,
        partnersInvolved,
        readyForReconciliation: issues.length === 0,
        issues,
      };
    } catch (error: any) {
      this.handleFirebaseError(error, "Reconciliation Period Summary");
    }
  }

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

  /**
   * Get monthly allocation summary for a specific partner (for JV Partner reps)
   */
  async getMonthlyAllocationSummary(
    partnerId: string,
    year: number,
    month: number
  ): Promise<{
    partner: string;
    period: string;
    totalProductionInput: number;
    totalAllocatedVolume: number;
    totalVolumeLoss: number;
    allocationCount: number;
    allocations: AllocationResult[];
    productionEntries: ProductionEntry[];
  }> {
    try {
      // Calculate date range for the month
      const startDate = new Date(year, month - 1, 1); // month is 0-indexed
      const endDate = new Date(year, month, 0); // Last day of month
      endDate.setHours(23, 59, 59, 999);
      // Get allocation results for this partner and period
      const constraints: QueryConstraint[] = [
        where("partner", "==", partnerId),
        where("timestamp", ">=", Timestamp.fromDate(startDate)),
        where("timestamp", "<=", Timestamp.fromDate(endDate)),
        orderBy("timestamp", "desc"),
      ];

      const allocationsQuery = query(
        collection(db, "allocation_results"),
        ...constraints
      );
      const allocationsSnapshot = await getDocs(allocationsQuery);

      const allocations = allocationsSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
            created_at: doc.data().created_at.toDate(),
          } as AllocationResult)
      );

      // Get production entries for this partner and period
      const productionEntries = await this.getAllProductionEntriesForPeriod(
        partnerId,
        startDate,
        endDate
      );

      // Calculate totals
      const totalAllocatedVolume = allocations.reduce(
        (sum, allocation) => sum + allocation.allocated_volume,
        0
      );

      const totalVolumeLoss = allocations.reduce(
        (sum, allocation) => sum + (allocation.volume_loss || 0),
        0
      );

      const totalProductionInput = productionEntries.reduce(
        (sum, entry) => sum + entry.gross_volume_bbl,
        0
      );

      return {
        partner: partnerId,
        period: `${year}-${month.toString().padStart(2, "0")}`,
        totalProductionInput: Math.round(totalProductionInput * 100) / 100,
        totalAllocatedVolume: Math.round(totalAllocatedVolume * 100) / 100,
        totalVolumeLoss: Math.round(totalVolumeLoss * 100) / 100,
        allocationCount: allocations.length,
        allocations,
        productionEntries: productionEntries,
      };
    } catch (error: any) {
      this.handleFirebaseError(error, "Monthly Allocation Summary");
    }
  }

  /**
   * Get allocation results for a specific partner with enhanced filtering
   */
  async getPartnerAllocations(
    partnerId: string,
    startDate?: Date,
    endDate?: Date,
    limitCount?: number
  ): Promise<AllocationResult[]> {
    try {
      const constraints: QueryConstraint[] = [
        where("partner", "==", partnerId),
        orderBy("timestamp", "desc"),
      ];

      if (startDate) {
        constraints.push(
          where("timestamp", ">=", Timestamp.fromDate(startDate))
        );
      }

      if (endDate) {
        constraints.push(where("timestamp", "<=", Timestamp.fromDate(endDate)));
      }

      if (limitCount) {
        constraints.push(limit(limitCount));
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
    } catch (error: any) {
      this.handleFirebaseError(error, "Partner Allocations Retrieval");
    }
  }

  /**
   * Get comprehensive reconciliation report for JV Coordinators
   */
  async getReconciliationReport(reconciliationId: string): Promise<{
    reconciliation: ReconciliationRun;
    allocations: AllocationResult[];
    summary: {
      totalPartners: number;
      totalInputVolume: number;
      actualTerminalVolume: number;
      totalAllocatedVolume: number;
      totalVolumeLoss: number;
      shrinkagePercentage: number;
    };
  }> {
    try {
      // Get reconciliation run
      const reconciliationDoc = await getDoc(
        doc(db, "reconciliation_runs", reconciliationId)
      );
      if (!reconciliationDoc.exists()) {
        throw new Error("Reconciliation run not found");
      }

      const reconciliation = {
        id: reconciliationDoc.id,
        ...reconciliationDoc.data(),
        timestamp: reconciliationDoc.data()!.timestamp.toDate(),
        created_at: reconciliationDoc.data()!.created_at.toDate(),
      } as ReconciliationRun;

      // Get allocation results for this reconciliation
      const allocationsQuery = query(
        collection(db, "allocation_results"),
        where("reconciliation_id", "==", reconciliationId),
        orderBy("allocated_volume", "desc")
      );

      const allocationsSnapshot = await getDocs(allocationsQuery);
      const allocations = allocationsSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate(),
            created_at: doc.data().created_at.toDate(),
          } as AllocationResult)
      );

      // Calculate summary
      const totalAllocatedVolume = allocations.reduce(
        (sum, allocation) => sum + allocation.allocated_volume,
        0
      );

      const totalVolumeLoss = allocations.reduce(
        (sum, allocation) => sum + (allocation.volume_loss || 0),
        0
      );

      const summary = {
        totalPartners: allocations.length,
        totalInputVolume: reconciliation.total_input_volume,
        actualTerminalVolume: reconciliation.total_terminal_volume,
        totalAllocatedVolume: Math.round(totalAllocatedVolume * 100) / 100,
        totalVolumeLoss: Math.round(totalVolumeLoss * 100) / 100,
        shrinkagePercentage: reconciliation.shrinkage_factor,
      };

      return {
        reconciliation,
        allocations,
        summary,
      };
    } catch (error: any) {
      this.handleFirebaseError(error, "Reconciliation Report");
    }
  }

  // Audit Logs
  private async createAuditLog(logData: Omit<AuditLog, "id">): Promise<void> {
    try {
      await addDoc(collection(db, "audit_logs"), {
        ...logData,
        timestamp: Timestamp.fromDate(logData.timestamp),
      });
    } catch (error: any) {
      console.error("Error creating audit log:", error);
      // Don't throw here to avoid breaking main operations
    }
  }

  async getAuditLogs(
    entityType?: string,
    entityId?: string,
    userId?: string,
    limitCount: number = 100
  ): Promise<AuditLog[]> {
    try {
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
    } catch (error: any) {
      this.handleFirebaseError(error, "Audit Logs Retrieval");
    }
  }

  /**
   * Get a user by their Firebase UID
   */
  async getUserById(uid: string): Promise<User | unknown | null> {
    try {
      const userDoc = await getDoc(doc(db, userDB, uid));
      if (!userDoc.exists()) {
        return null;
      }
      return {
        id: userDoc.id,
        ...userDoc.data(),
      } as unknown;
    } catch (error: any) {
      this.handleFirebaseError(error, "User Retrieval");
    }
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
    try {
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
    } catch (error: any) {
      this.handleFirebaseError(error, "Allocation Results Retrieval");
    }
  }

  // Real-time subscriptions with enhanced error handling
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

    return onSnapshot(
      q,
      (querySnapshot) => {
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
      },
      (error) => {
        console.error("Production entries subscription error:", error);
        callback([]); // Return empty array on error
      }
    );
  }

  subscribeToTerminalReceipts(
    callback: (receipts: TerminalReceipt[]) => void
  ): () => void {
    const q = query(
      collection(db, "terminal_receipts"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
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
      },
      (error) => {
        console.error("Terminal receipts subscription error:", error);
        callback([]);
      }
    );
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

    return onSnapshot(
      q,
      (querySnapshot) => {
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
      },
      (error) => {
        console.error("Allocation results subscription error:", error);
        callback([]);
      }
    );
  }
  subscribeToReconciliationRuns(
    callback: (runs: ReconciliationRun[]) => void
  ): () => void {
    const q = query(
      collection(db, "reconciliation_runs"),
      orderBy("created_at", "desc"),
      limit(50)
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
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
      },
      (error) => {
        console.error("Reconciliation runs subscription error:", error);
        callback([]);
      }
    );
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

    return onSnapshot(
      q,
      (querySnapshot) => {
        const logs = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp.toDate(),
            } as AuditLog)
        );

        callback(logs);
      },
      (error) => {
        console.error("Audit Log subscription error:", error);
        callback([]);
      }
    );
  }
}
export const firebaseService = new FirebaseService();
