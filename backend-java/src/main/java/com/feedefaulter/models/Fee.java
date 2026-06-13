package com.feedefaulter.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Data
@Entity
@Table(name = "fee")
public class Fee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @Column(name = "total_fee")
    private Integer totalFee;

    @Column(name = "paid_amount", columnDefinition = "integer default 0")
    private Integer paidAmount = 0;

    @Column
    private LocalDateTime deadline;

    public Integer getDueAmount() {
        if (totalFee == null) return 0;
        int paid = paidAmount == null ? 0 : paidAmount;
        return totalFee - paid;
    }

    public Integer getLateFine() {
        if (getDueAmount() > 0 && deadline != null && LocalDateTime.now().isAfter(deadline)) {
            long daysLate = ChronoUnit.DAYS.between(deadline, LocalDateTime.now());
            return Math.max(0, (int) daysLate * 50); // ₹50 per day
        }
        return 0;
    }

    public Integer getTotalDue() {
        return getDueAmount() + getLateFine();
    }

    public String getStatus() {
        if (getDueAmount() <= 0) {
            return "Paid";
        } else if (deadline != null && LocalDateTime.now().isAfter(deadline)) {
            return "Overdue";
        } else {
            return "Partial";
        }
    }
}
