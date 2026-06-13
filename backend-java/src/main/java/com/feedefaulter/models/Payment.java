package com.feedefaulter.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @Column
    private Integer amount;

    @Column(name = "date")
    private LocalDateTime date = LocalDateTime.now();

    @Column(length = 50)
    private String method;

    @Column(name = "transaction_id", length = 100, unique = true)
    private String transactionId;
}
