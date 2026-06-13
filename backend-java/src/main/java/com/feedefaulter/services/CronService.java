package com.feedefaulter.services;

import com.feedefaulter.models.Fee;
import com.feedefaulter.repositories.FeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CronService {

    private final FeeRepository feeRepository;
    private final AlertService alertService;

    @Scheduled(cron = "0 0 9 * * ?")
    public void checkDefaultersAndSendAlerts() {
        System.out.println("[CRON] Checking for fee defaulters...");
        List<Fee> allFees = feeRepository.findAll();
        for (Fee fee : allFees) {
            if ("Overdue".equals(fee.getStatus()) && fee.getStudent() != null) {
                alertService.alertStudent(fee.getStudent(), fee);
            }
        }
    }
}
