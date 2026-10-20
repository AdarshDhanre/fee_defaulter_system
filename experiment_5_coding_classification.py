import pandas as pd
import numpy as np

# ==============================================================================
# EXPERIMENT 5: RAW DATA CODING AND CLASSIFICATION
# ==============================================================================

# 1. Ingest Raw Dataset (Unprocessed Survey Responses)
raw_data = {
    "student_id": ["STU_001", "STU_002", "STU_003", "STU_004", "STU_005", "STU_006"],
    "gender_raw": ["Female", "Male", "male", "Female", "MALE", "Female"],
    "pay_mode_raw": ["Online UPI", "Bank Challan", "Cash Counter", "Net Banking", "online upi", "bank challan"],
    "satisfaction_raw": ["Satisfied", "Neutral", "Dissatisfied", "Highly Satisfied", "Satisfied", "Very Dissatisfied"],
    "pending_due": [0, 12500, 28000, 4500, 0, 35000]
}
df = pd.DataFrame(raw_data)

print("--- 1. ORIGINAL RAW DATASET ---")
print(df)
print("\n" + "="*60 + "\n")

# 2. Data Editing: Clean Whitespace & Normalize String Casing
df["gender_clean"] = df["gender_raw"].str.strip().str.capitalize()
df["pay_mode_clean"] = df["pay_mode_raw"].str.strip().str.title()

# 3. Categorical Coding (Applying Codebook Mapping Rules)
# GEN_COD: 1 = Male, 2 = Female
gender_map = {"Male": 1, "Female": 2}

# PAY_MOD: 1 = Online UPI, 2 = Net Banking, 3 = Bank Challan, 4 = Cash Counter
pay_map = {"Online Upi": 1, "Net Banking": 2, "Bank Challan": 3, "Cash Counter": 4}

# SAT_LVL: 1 = Very Dissatisfied, 2 = Dissatisfied, 3 = Neutral, 4 = Satisfied, 5 = Highly Satisfied
sat_map = {"Very Dissatisfied": 1, "Dissatisfied": 2, "Neutral": 3, "Satisfied": 4, "Highly Satisfied": 5}

df["GEN_COD"] = df["gender_clean"].map(gender_map)
df["PAY_MOD"] = df["pay_mode_clean"].map(pay_map)
df["SAT_LVL"] = df["satisfaction_raw"].map(sat_map)

# 4. Quantitative Classification: Binning Pending Dues into Class Intervals
# 0 = Clear (₹0), 1 = Low (₹1 - ₹5,000), 2 = Medium (₹5,001 - ₹20,000), 3 = Critical Defaulter (> ₹20,000)
bins = [-1, 0, 5000, 20000, np.inf]
labels = [0, 1, 2, 3]
df["DUE_CLS"] = pd.cut(df["pending_due"], bins=bins, labels=labels)

# 5. Extract Final Coded Matrix & Export to CSV
coded_df = df[["student_id", "GEN_COD", "PAY_MOD", "SAT_LVL", "DUE_CLS"]]

print("--- 2. FINAL TRANSFORMED & CODED DATA MATRIX ---")
print(coded_df)
print("\n" + "="*60 + "\n")

output_csv = "coded_survey_dataset.csv"
coded_df.to_csv(output_csv, index=False)
print(f"SUCCESS: Exported clean coded dataset to '{output_csv}'!")
