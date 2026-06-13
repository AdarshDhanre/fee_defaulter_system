package com.feedefaulter.repositories;

import com.feedefaulter.models.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByStudentId(Long studentId);
    java.util.Optional<Payment> findByTransactionId(String transactionId);
}
