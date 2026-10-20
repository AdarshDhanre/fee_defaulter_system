# 🧪 Experiment No. 5: Raw Data Coding and Classification

## 1. Aim
To understand and implement the complete process of **Raw Data Editing, Coding, and Classification** on an empirical survey dataset, construct a standardized Research Codebook (Data Dictionary), and transform unstructured raw responses into structured numeric matrices suitable for statistical and computational analysis.

---

## 2. Apparatus & Software Requirements
- **Hardware:** Personal Computer / Workstation (Intel Core i3+, 4GB RAM).
- **Operating System:** Windows 10/11 or Linux.
- **Software / Libraries:** Python 3.9+ runtime with `pandas` and `numpy`.
- **Statistical Framework:** Categorical Label Encoding, Binning Class Intervals, Codebook / Metadata Dictionary.

---

## 3. Theoretical Foundation & Concepts
1. **Raw Data:** Unprocessed, unfiltered observations collected directly from respondents.
2. **Data Editing:** Systematic inspection of survey sheets to correct typographical errors, inconsistent casing, and missing entries.
3. **Data Coding:** Converting qualitative/text answers into standardized numeric codes (e.g., Male = 1, Female = 2).
4. **Data Classification:** Grouping observations into homogeneous classes (e.g., fee dues 0-5k, 5k-20k).
5. **Research Codebook:** Master data dictionary defining variable names, question descriptions, measurement scales, and numeric mapping rules.

---

## 4. Case Study: Raw Survey Responses
| Student ID | Gender (Raw) | Payment Mode (Raw) | Satisfaction (Raw) | Pending Due (INR) |
|---|---|---|---|---|
| STU_001 | Female | Online UPI | Satisfied | 0 |
| STU_002 | Male | Bank Challan | Neutral | 12500 |
| STU_003 | male | Cash Counter | Dissatisfied | 28000 |
| STU_004 | Female | Net Banking | Highly Satisfied | 4500 |
| STU_005 | MALE | online upi | Satisfied | 0 |
| STU_006 | Female | bank challan | Very Dissatisfied | 35000 |

---

## 5. Standardized Research Codebook (Data Dictionary)
| Variable Name | Variable Description | Scale | Value Coding Specification |
|---|---|---|---|
| **GEN_COD** | Respondent Gender | Nominal | 1 = Male, 2 = Female |
| **PAY_MOD** | Primary Payment Mode | Nominal | 1 = Online UPI, 2 = Net Banking, 3 = Bank Challan, 4 = Cash Counter |
| **SAT_LVL** | Portal Satisfaction | Ordinal | 5 = Highly Satisfied, 4 = Satisfied, 3 = Neutral, 2 = Dissatisfied, 1 = Very Dissatisfied |
| **DUE_CLS** | Due Classification | Interval | 0 = Clear (₹0), 1 = Low (₹1-₹5,000), 2 = Medium (₹5,001-₹20,000), 3 = Critical (>₹20,000) |

---

## 6. Final Transformed & Coded Dataset Matrix
| Student ID | GEN_COD | PAY_MOD | SAT_LVL | DUE_CLS |
|---|---|---|---|---|
| STU_001 | 2 | 1 | 4 | 0 (Clear) |
| STU_002 | 1 | 3 | 3 | 2 (Medium Dues) |
| STU_003 | 1 | 4 | 2 | 3 (Critical Defaulter) |
| STU_004 | 2 | 2 | 5 | 1 (Low Dues) |
| STU_005 | 1 | 1 | 4 | 0 (Clear) |
| STU_006 | 2 | 3 | 1 | 3 (Critical Defaulter) |

---

## 7. Python Implementation Script
```python
import pandas as pd
import numpy as np

# 1. Raw Dataset
raw_data = {
    "student_id": ["STU_001", "STU_002", "STU_003", "STU_004", "STU_005", "STU_006"],
    "gender_raw": ["Female", "Male", "male", "Female", "MALE", "Female"],
    "pay_mode_raw": ["Online UPI", "Bank Challan", "Cash Counter", "Net Banking", "online upi", "bank challan"],
    "satisfaction_raw": ["Satisfied", "Neutral", "Dissatisfied", "Highly Satisfied", "Satisfied", "Very Dissatisfied"],
    "pending_due": [0, 12500, 28000, 4500, 0, 35000]
}
df = pd.DataFrame(raw_data)

# 2. Data Cleaning
df["gender_clean"] = df["gender_raw"].str.strip().str.capitalize()
df["pay_mode_clean"] = df["pay_mode_raw"].str.strip().str.title()

# 3. Categorical Coding
gender_map = {"Male": 1, "Female": 2}
pay_map = {"Online Upi": 1, "Net Banking": 2, "Bank Challan": 3, "Cash Counter": 4}
sat_map = {"Very Dissatisfied": 1, "Dissatisfied": 2, "Neutral": 3, "Satisfied": 4, "Highly Satisfied": 5}

df["GEN_COD"] = df["gender_clean"].map(gender_map)
df["PAY_MOD"] = df["pay_mode_clean"].map(pay_map)
df["SAT_LVL"] = df["satisfaction_raw"].map(sat_map)

# 4. Quantitative Classification (Binning)
bins = [-1, 0, 5000, 20000, np.inf]
labels = [0, 1, 2, 3]  # 0: Clear, 1: Low, 2: Medium, 3: Critical
df["DUE_CLS"] = pd.cut(df["pending_due"], bins=bins, labels=labels)

# 5. Export
coded_df = df[["student_id", "GEN_COD", "PAY_MOD", "SAT_LVL", "DUE_CLS"]]
coded_df.to_csv("coded_survey_dataset.csv", index=False)
print("Successfully processed and exported coded dataset!")
```

---

## 8. Result & Conclusion
Raw survey data was successfully edited, coded, and classified following standardized research methodologies. An exhaustive research codebook was established defining variable attributes across nominal, ordinal, and ratio scales. The transformed data matrix was programmatically verified and exported in CSV format, proving readiness for quantitative econometric and statistical analysis.

---

## 9. Viva-Voce Questions
- **Q1: Data Coding aur Data Classification me kya farq hai?**  
  *Ans:* Coding me qualitative text ko numeric labels (e.g. Male = 1, Female = 2) diye jaate hain. Classification me data ko common properties ya intervals ke basis par groups me divide kiya jata hai.
- **Q2: Research Codebook kyu zaroori hai?**  
  *Ans:* Codebook ek standard data dictionary hai jo variables, values aur codes ko document karti hai taaki koi bhi researcher dataset ko bina kisi confusion ke accurately samajh sake.
- **Q3: Mutually Exclusive classes kya hoti hain?**  
  *Ans:* Non-overlapping class intervals (jaise 0-5000 aur 5001-10000) taaki koi bhi value do alag groups me double count na ho.
