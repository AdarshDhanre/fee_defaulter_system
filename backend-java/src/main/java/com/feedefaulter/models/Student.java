package com.feedefaulter.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.ArrayList;

@Data
@Entity
@Table(name = "student")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100)
    @NotBlank(message = "Student name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @Column(name = "roll_no", length = 50)
    @NotBlank(message = "Roll number is required")
    @Size(max = 50, message = "Roll number must not exceed 50 characters")
    private String rollNo;

    @Column(length = 50)
    @NotBlank(message = "Course is required")
    @Size(max = 50, message = "Course name must not exceed 50 characters")
    private String course;

    @Column(length = 50)
    @NotBlank(message = "Year is required")
    @Size(max = 50, message = "Year must not exceed 50 characters")
    private String year;

    @Column(length = 50)
    @NotBlank(message = "Branch is required")
    @Size(max = 50, message = "Branch name must not exceed 50 characters")
    private String branch;

    @Column(length = 50)
    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must not exceed 50 characters")
    private String category;

    @Column(length = 100)
    @NotBlank(message = "Email is required")
    @Email(message = "Email address must be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @ToString.Exclude
    private List<Fee> fees = new ArrayList<>();

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @ToString.Exclude
    private List<Payment> payments = new ArrayList<>();

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    @ToString.Exclude
    private List<OfflineReceipt> offlineReceipts = new ArrayList<>();
}
