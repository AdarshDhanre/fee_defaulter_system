# 🧪 Experiment No. 4: Design Simple Sampling Method for Survey

## 1. Aim
To design, formulate, and implement a statistically sound **Simple Sampling Method (Simple Random Sampling - SRS)** for conducting an institutional survey, calculate the optimal sample size using Yamane’s precision formula, and simulate the random selection programmatically.

---

## 2. Apparatus & Software Requirements
- **Hardware:** Personal Computer / Workstation (Intel Core i3+, 4GB RAM).
- **Operating System:** Windows 10/11 or Linux.
- **Software / Libraries:** Python 3.9+ runtime with `random`, `pandas`, and `math`.
- **Statistical Framework:** Yamane’s Sampling Formula (1967), Pseudo-Random Number Generator (PRNG).

---

## 3. Theoretical Foundation & Concepts
- **Target Population ($N$):** Complete universe under investigation ($N = 1,200$ college students).
- **Sampling Frame:** Indexed roster containing every unique individual (`STU-0001` to `STU-1200`).
- **Sample ($n$):** A statistically calculated representative subset.
- **Simple Random Sampling (SRS):** Every member possesses an identical probability of selection:
  $$P = \frac{1}{N}$$
- **SRSWOR (Without Replacement):** Selected unit is removed from the selection pool, ensuring uniqueness (standard for surveys).

---

## 4. Step-by-Step Procedure
1. **Define Survey Boundary:** Target Population $N = 1,200$ students.
2. **Create Unique Sampling Frame:** Generate unique IDs (`STU_0001` to `STU_1200`).
3. **Determine Sample Size:** Using Yamane's formula at $95\%$ confidence level and $e = 5\%$.
4. **Programmatic Selection:** Execute PRNG random sampling without replacement (`random.sample()`).
5. **Questionnaire Administration:** Distribute survey with objective rating scales.
6. **Non-Response Mitigation:** Maintain a $10\%$ reserve pool.

---

## 5. Mathematical Sample Size Calculation
Yamane’s Formula:
$$n = \frac{N}{1 + N \cdot e^2}$$

Given:
- $N = 1,200$
- $e = 0.05$ (5% precision)

$$n = \frac{1200}{1 + 1200 \cdot (0.05)^2} = \frac{1200}{1 + 1200 \cdot 0.0025} = \frac{1200}{1 + 3.0} = \frac{1200}{4} = 300$$

**Result:** Sample Size ($n$) = **300 students**.

---

## 6. Survey Questionnaire Design
| Q. No. | Question | Measurement Scale |
|---|---|---|
| **Q1** | What is your primary method for institutional fee payment? | Multiple Choice: [UPI / Net Banking / Challan / Cash] |
| **Q2** | Have you ever incurred late payment penalty fees due to forgotten due dates? | Dichotomous: [Yes / No] |
| **Q3** | How satisfied are you with the offline receipt verification turnaround time? | 5-Point Likert Scale (1 = Very Dissatisfied to 5 = Highly Satisfied) |
| **Q4** | Would an automated WhatsApp/Email alert system with PDF receipts benefit your parents? | Agreement Scale: [Strongly Agree / Neutral / Disagree] |

---

## 7. Python Implementation Code
```python
import random
import pandas as pd

# Population parameters
N = 1200
e = 0.05

# Yamane formula
n = int(N / (1 + N * (e ** 2)))
print(f"Population (N): {N}, Required Sample (n): {n}")

# Sampling frame
population_frame = [f"STU_{i:04d}" for i in range(1, N + 1)]

# Simple Random Sampling Without Replacement (SRSWOR)
random.seed(42)
sampled_students = random.sample(population_frame, n)

# Export to CSV
df = pd.DataFrame({"Sample_Index": range(1, n + 1), "Selected_Student_ID": sampled_students})
df.to_csv("survey_sample_list.csv", index=False)
print("Successfully generated survey sample list!")
```

---

## 8. Comparative Merits & Demerits
| Advantages (Merits) | Limitations (Demerits) |
|---|---|
| Complete elimination of human investigator bias | Requires an exhaustive and updated sampling frame |
| Equal selection probability ($1/N$) for all units | Rare subgroups may get underrepresented by random chance |
| Straightforward statistical verification | Prone to dropouts if respondents refuse to answer |

---

## 9. Result & Conclusion
A Simple Random Sampling (SRS) model was successfully designed for an institutional survey. Applying Yamane’s precision formula at a 95% confidence level ($e = 0.05$), a statistically optimal sample size of **$n = 300$** was computed from a population of $N = 1,200$, and programmatically verified using Python.

---

## 10. Viva-Voce Questions
- **Q1: Difference between Probability and Non-Probability sampling?**  
  *Ans:* Probability sampling gives every member a known, non-zero chance of selection (eliminating bias). Non-probability sampling chooses subjects arbitrarily (e.g. convenience).
- **Q2: Why use Yamane's formula?**  
  *Ans:* It balances statistical precision and cost by calculating the minimum sample needed for a specific margin of error ($5\%$).
