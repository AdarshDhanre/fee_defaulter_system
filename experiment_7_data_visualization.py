import matplotlib.pyplot as plt
import numpy as np

# ==============================================================================
# EXPERIMENT 7: USING BAR GRAPHS AND PIE CHARTS FOR INTERPRETING FINDINGS
# ==============================================================================

print("Generating Experiment 7 Charts...")

# ------------------------------------------------------------------------------
# 1. PIE CHART: Distribution of Primary Fee Payment Modes (Proportions)
# ------------------------------------------------------------------------------
labels = ['Online UPI', 'Net Banking', 'Bank Challan', 'Cash Counter']
sizes = [45, 15, 25, 15]
colors = ['#2563EB', '#38BDF8', '#F59E0B', '#EF4444']
explode = (0.05, 0, 0.05, 0)

plt.figure(figsize=(6, 4.5), dpi=300)
wedges, texts, autotexts = plt.pie(
    sizes, explode=explode, labels=labels, autopct='%1.1f%%',
    startangle=140, colors=colors,
    textprops=dict(color="black", fontsize=10),
    wedgeprops=dict(width=0.9, edgecolor='white', linewidth=1.5)
)
for autotext in autotexts:
    autotext.set_color('white')
    autotext.set_weight('bold')

plt.title('Figure 1: Distribution of Student Fee Payment Channels (N = 100)', fontsize=12, fontweight='bold', pad=15)
plt.tight_layout()
plt.savefig('chart_1_pie_payment_modes.png')
plt.close()
print("Saved: chart_1_pie_payment_modes.png")

# ------------------------------------------------------------------------------
# 2. SIMPLE BAR GRAPH: Defaulter Severity Classification (Frequencies)
# ------------------------------------------------------------------------------
categories = ['Clear (No Dues)', 'Low (₹1-5k)', 'Medium (₹5k-20k)', 'Critical (>₹20k)']
counts = [62, 12, 14, 12]
bar_colors = ['#10B981', '#FBBF24', '#F97316', '#DC2626']

plt.figure(figsize=(6.5, 4.2), dpi=300)
bars = plt.bar(categories, counts, color=bar_colors, width=0.55, edgecolor='#1F2937', linewidth=0.8)
plt.ylabel('Number of Students', fontsize=11, fontweight='bold')
plt.title('Figure 2: Student Distribution across Fee Due Categories (N = 100)', fontsize=12, fontweight='bold', pad=15)
plt.ylim(0, 75)
plt.grid(axis='y', linestyle='--', alpha=0.5)

for bar in bars:
    height = bar.get_height()
    plt.annotate(f'{height}',
                 xy=(bar.get_x() + bar.get_width() / 2, height),
                 xytext=(0, 3),
                 textcoords="offset points",
                 ha='center', va='bottom', fontsize=10, fontweight='bold')

plt.tight_layout()
plt.savefig('chart_2_bar_defaulter_distribution.png')
plt.close()
print("Saved: chart_2_bar_defaulter_distribution.png")

# ------------------------------------------------------------------------------
# 3. GROUPED BAR GRAPH: Payment Mode vs Defaulter Incidence (Bivariate)
# ------------------------------------------------------------------------------
modes = ['Online Payers (UPI/Cards)', 'Offline Payers (Challan/Cash)']
clear_counts = [48, 14]
defaulter_counts = [12, 26]

x = np.arange(len(modes))
width = 0.32

plt.figure(figsize=(6.5, 4.2), dpi=300)
rects1 = plt.bar(x - width/2, clear_counts, width, label='Non-Defaulters (Clear)', color='#10B981', edgecolor='black', linewidth=0.8)
rects2 = plt.bar(x + width/2, defaulter_counts, width, label='Fee Defaulters (Pending)', color='#EF4444', edgecolor='black', linewidth=0.8)

plt.ylabel('Student Headcount', fontsize=11, fontweight='bold')
plt.title('Figure 3: Payment Channel vs Fee Defaulter Occurrence', fontsize=12, fontweight='bold', pad=15)
plt.xticks(x, modes, fontsize=10, fontweight='bold')
plt.legend(frameon=True, facecolor='#F9FAFB', edgecolor='#D1D5DB')
plt.ylim(0, 60)
plt.grid(axis='y', linestyle='--', alpha=0.5)

for rect in rects1:
    h = rect.get_height()
    plt.annotate(f'{h}', xy=(rect.get_x() + rect.get_width() / 2, h), xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=9.5, fontweight='bold')

for rect in rects2:
    h = rect.get_height()
    plt.annotate(f'{h}', xy=(rect.get_x() + rect.get_width() / 2, h), xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=9.5, fontweight='bold')

plt.tight_layout()
plt.savefig('chart_3_grouped_payment_vs_default.png')
plt.close()
print("Saved: chart_3_grouped_payment_vs_default.png")

print("\nSUCCESS: All Experiment 7 charts generated and saved successfully!")
