package com.feedefaulter.repositories;

import com.feedefaulter.models.FeeStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FeeStructureRepository extends JpaRepository<FeeStructure, Long> {
    Optional<FeeStructure> findFirstByCourseAndYearAndBranchContainingIgnoreCase(String course, String year, String branch);
}
