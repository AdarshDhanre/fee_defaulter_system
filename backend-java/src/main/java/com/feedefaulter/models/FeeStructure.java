package com.feedefaulter.models;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "fee_structure")
public class FeeStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String course;

    @Column(nullable = false, length = 50)
    private String year;

    @Column(nullable = false, length = 100)
    private String branch;

    @Column(name = "fee_mgmt", nullable = false)
    private Double feeMgmt;

    @Column(name = "fee_open", nullable = false)
    private Double feeOpen;

    @Column(name = "fee_obc", nullable = false)
    private Double feeObc;

    @Column(name = "fee_vjnt", nullable = false)
    private Double feeVjnt;

    @Column(name = "fee_scst", nullable = false)
    private Double feeScst;

    @Column(name = "fee_oms", nullable = false)
    private Double feeOms;
}
