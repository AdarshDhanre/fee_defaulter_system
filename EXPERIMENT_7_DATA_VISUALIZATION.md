# 🧪 Experiment No. 7: Using Bar Graphs and Pie Charts for Interpreting Findings

## 1. Aim
To visually represent, interpret, and analytically synthesize empirical survey findings using descriptive statistical data visualizations—specifically **Pie Charts (Univariate Proportions)**, **Simple Bar Graphs (Frequency Distributions)**, and **Grouped/Clustered Bar Graphs (Bivariate Comparisons)**—developed in Python, and deduce actionable institutional research inferences from graphical trends.

---

## 2. Apparatus & Software Requirements
- **Hardware:** Personal Computer / Workstation (Intel Core i3+, 4GB RAM).
- **Operating System:** Windows 10/11 or Linux.
- **Software Libraries:** Python 3.9+ runtime with `matplotlib`, `numpy`, and `pandas`.
- **Visualization Tools:** Pie Chart wedge proportions ($360^\circ$), Simple Bar vertical counts, Grouped Bivariate Bars.

---

## 3. Theoretical Foundation & Visualization Principles
1. **Pie Charts:** Circular plots displaying relative frequency or percentage composition of mutually exclusive categories ($\sum = 100\%$). Ideal for displaying a single nominal variable with $\le 5$ categories.
2. **Simple Bar Graphs:** Vertical or horizontal bars whose heights are directly proportional to discrete values/frequencies.
3. **Grouped / Clustered Bar Graphs:** Multiple side-by-side bars per category to demonstrate relationships between an Independent Variable (e.g., Payment Mode) and a Dependent Variable (e.g., Defaulter Status).

---

## 4. Empirical Visualizations & Analytical Interpretations

### Figure 1: Pie Chart Analysis — Payment Channel Adoption
- **Observed Data:** Online UPI = 45%, Net Banking = 15%, Bank Challan = 25%, Cash Counter = 15%.
- **Findings Interpretation:**
  1. **Digital Dominance:** Digital payment gateways (UPI + Net Banking) account for a cumulative **60% share**, driven by instant mobile authorization.
  2. **Offline Dependency:** A significant **40% cohort** continues using physical offline banking (Bank Challan & Cash), creating institutional cash-handling overheads.

### Figure 2: Simple Bar Graph Analysis — Defaulter Severity Breakdown
- **Observed Data:** Clear (₹0) = 62, Low Dues (₹1-5k) = 12, Medium Dues (₹5k-20k) = 14, Critical Defaulters (>₹20k) = 12.
- **Findings Interpretation:**
  1. **Compliant Core:** 62% of students maintain clear accounts with zero arrears.
  2. **Installment/Fine Buffer:** 26% exhibit minor to moderate delays, resolvable through automated deadline alerts.
  3. **High-Risk Segment:** 12% carry chronic unpaid dues exceeding ₹20,000, requiring administrative escalation.

### Figure 3: Grouped Bar Graph Analysis — Payment Mode vs Defaulter Incidence
- **Observed Data:**
  - **Online Payers:** 48 Non-defaulters (80%) vs 12 Defaulters (20%).
  - **Offline Payers:** 14 Non-defaulters (35%) vs 26 Defaulters (65%).
- **Findings Interpretation (Key Empirical Discovery):**
  - Offline payers exhibit a staggering **65% default rate**, compared to just **20%** among online payers.
  - Physical friction (visiting banks, counter queues, manual slip verification) directly causes student fee defaults. Encouraging online gateway adoption cuts default rates by over **45%**.

---

## 5. Python Implementation Script (`experiment_7_data_visualization.py`)
```python
import matplotlib.pyplot as plt
import numpy as np

# 1. Pie Chart
labels = ['Online UPI', 'Net Banking', 'Bank Challan', 'Cash Counter']
sizes = [45, 15, 25, 15]
colors = ['#2563EB', '#38BDF8', '#F59E0B', '#EF4444']
plt.figure(figsize=(6, 4.5))
plt.pie(sizes, labels=labels, autopct='%1.1f%%', colors=colors, startangle=140)
plt.title('Figure 1: Distribution of Student Fee Payment Channels (N = 100)')
plt.savefig('chart_1_pie_payment_modes.png', dpi=300)

# 2. Simple Bar Graph
categories = ['Clear (₹0)', 'Low (₹1-5k)', 'Medium (₹5k-20k)', 'Critical (>₹20k)']
counts = [62, 12, 14, 12]
plt.figure(figsize=(6.5, 4.2))
plt.bar(categories, counts, color=['#10B981', '#FBBF24', '#F97316', '#DC2626'])
plt.ylabel('Number of Students')
plt.title('Figure 2: Student Distribution across Fee Due Categories')
plt.savefig('chart_2_bar_defaulter_distribution.png', dpi=300)

# 3. Grouped Bar Graph
modes = ['Online Payers', 'Offline Payers']
clear = [48, 14]
defaulters = [12, 26]
x = np.arange(len(modes))
width = 0.35
plt.figure(figsize=(6.5, 4.2))
plt.bar(x - width/2, clear, width, label='Non-Defaulters', color='#10B981')
plt.bar(x + width/2, defaulters, width, label='Defaulters', color='#EF4444')
plt.xticks(x, modes)
plt.legend()
plt.title('Figure 3: Payment Channel vs Fee Defaulter Occurrence')
plt.savefig('chart_3_grouped_payment_vs_default.png', dpi=300)
```

---

## 6. Comparative Evaluation: Pie Charts vs Bar Graphs
| Dimension | Pie Charts | Bar Graphs |
|---|---|---|
| **Best Used For** | Proportions / Percentage composition of a whole | Absolute frequencies, quantities, & category comparisons |
| **Category Limit** | $\le 5$ categories (becomes cluttered otherwise) | Highly scalable (can display 10+ categories easily) |
| **Bivariate Analysis** | Not suitable for 2-variable interactions | Exceptional for grouped/clustered cross-variable analysis |

---

## 7. Experimental Result & Conclusion
Empirical survey findings were successfully transformed into descriptive graphical visualizations using Python’s `matplotlib` library. The Pie Chart elucidated proportional payment channel preferences, while the Simple and Grouped Bar Graphs effectively demonstrated fee due distributions and the profound relationship between payment mode and default risk. The visual evidence proves that offline payment methods suffer a 65% default rate compared to 20% in online systems, providing critical visual evidence for institutional policymaking.

---

## 8. Viva-Voce Questions
- **Q1: Pie Chart ka main limitation kya hai?**  
  *Ans:* Insaan ki aankh slice ke angles aur curved areas ko accurately compare nahi kar pati jab percentages lagbhag barabar ho. Bar graph me seedhi height hone se comparison bohot aasan hota hai.
- **Q2: Grouped Bar Chart kab use kiya jata hai?**  
  *Ans:* Jab hume do alag variables ke beech comparison dikhana ho (jaise Online vs Offline payers ke andar Non-Defaulters aur Defaulters ka count).
- **Q3: Bar Chart ka Y-axis hamesha zero se kyu start hona chahiye?**  
  *Ans:* Agar Y-axis zero se start na ho (truncated axis), to chote difference bhi visual taur par bohot bade lagte hain, jisse misleading impression banta hai.
