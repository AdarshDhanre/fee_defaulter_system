package com.feedefaulter.repositories;

import com.feedefaulter.models.OfflineReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OfflineReceiptRepository extends JpaRepository<OfflineReceipt, Long> {
    List<OfflineReceipt> findByStudentId(Long studentId);
    List<OfflineReceipt> findByStatus(String status);
}
