package com.feedefaulter.services;

import com.feedefaulter.models.FeeStructure;
import com.feedefaulter.repositories.FeeStructureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Automatically seeds fee structure data on startup if the table is empty.
 * This ensures the "Allocate Student Fee" auto-fill works correctly.
 */
@Component
@RequiredArgsConstructor
public class FeeStructureSeeder {

    private final FeeStructureRepository feeStructureRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void seedFeeStructures() {
        if (feeStructureRepository.count() > 0) {
            System.out.println("[FEE-SEED] Fee structures already present. Skipping seed.");
            return;
        }

        System.out.println("[FEE-SEED] Seeding fee structures...");

        List<Object[]> feeData = List.of(
            new Object[]{"B. Tech",     "First Year",        "AI/CSE/CYS/ME/CE/IT/ETC/EE/DSE", 138745.00, 138745.00, 85050.00,  31354.00, 15245.00, 138745.00},
            new Object[]{"B. Tech",     "Direct Second Yr.", "AI/CSE/CYS/ME/CE/IT/ETC/EE/DSE", 124998.00, 124998.00, 77172.00,  29346.00, 14998.00, 124998.00},
            new Object[]{"M.Tech",      "First Year",        "CAD/CAM/VLSI/CSE/SRT",            100792.00, 100792.00, 100792.00, 100792.00, 14792.00, 100792.00},
            new Object[]{"MBA",         "First Year",        "MBA",                              117836.00, 117836.00, 74358.00,  30880.00, 17836.00, 117836.00},
            new Object[]{"MCA",         "First Year",        "MCA",                              100498.00, 100498.00, 63324.00,  26150.00, 14998.00, 100498.00},
            new Object[]{"BCCA",        "First Year",        "BCCA",                              37000.00,  37000.00, 37000.00,  37000.00, 12458.00,  37000.00},
            new Object[]{"BSC",         "First Year",        "CS/CYBER SECURITY",                55000.00,  55000.00, 55000.00,  55000.00, 32801.00,  55000.00},
            new Object[]{"M.SC",        "First Year",        "CS",                               51500.00,  51500.00, 51500.00,  51500.00, 14805.00,  51500.00},
            new Object[]{"Polytechnic", "First Year",        "ME/CSE/Civil/ETC/EE",              67139.00,  67139.00, 39019.50,  10900.00,  3139.00,  67139.00},
            new Object[]{"Polytechnic", "Direct Second Yr.", "ME/CSE/Civil/ETC/EE",              66927.00,  66927.00, 38807.50,  10688.00,  2927.00,  66927.00}
        );

        for (Object[] row : feeData) {
            FeeStructure fs = new FeeStructure();
            fs.setCourse((String) row[0]);
            fs.setYear((String) row[1]);
            fs.setBranch((String) row[2]);
            fs.setFeeMgmt((Double) row[3]);
            fs.setFeeOpen((Double) row[4]);
            fs.setFeeObc((Double) row[5]);
            fs.setFeeVjnt((Double) row[6]);
            fs.setFeeScst((Double) row[7]);
            fs.setFeeOms((Double) row[8]);
            feeStructureRepository.save(fs);
        }

        System.out.println("[FEE-SEED] DONE - " + feeData.size() + " fee structures seeded successfully.");
    }
}
