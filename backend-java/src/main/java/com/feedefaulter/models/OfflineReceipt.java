package com.feedefaulter.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "offline_receipt")
public class OfflineReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @Column(name = "file_path", nullable = false, length = 255)
    private String filePath;

    @Column(name = "extracted_utr", length = 100)
    private String extractedUtr;

    @Column(name = "extracted_amount")
    private Integer extractedAmount;

    @Column(name = "extracted_date", length = 50)
    private String extractedDate;

    // Status: 'Pending', 'Approved', 'Rejected', 'Fraud_Flagged'
    @Column(length = 50, columnDefinition = "varchar(50) default 'Pending'")
    private String status = "Pending";

    @Column(name = "ai_confidence", length = 20)
    private String aiConfidence;

    @Column(name = "upload_date")
    private LocalDateTime uploadDate = LocalDateTime.now();
}
