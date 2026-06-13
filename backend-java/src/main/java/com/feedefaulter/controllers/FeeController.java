package com.feedefaulter.controllers;

import com.feedefaulter.models.Fee;
import com.feedefaulter.models.FeeStructure;
import com.feedefaulter.models.Student;
import com.feedefaulter.repositories.FeeRepository;
import com.feedefaulter.repositories.FeeStructureRepository;
import com.feedefaulter.repositories.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/fees")
@RequiredArgsConstructor
public class FeeController {

    private final FeeRepository feeRepository;
    private final StudentRepository studentRepository;
    private final FeeStructureRepository feeStructureRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> viewFees() {
        List<Fee> fees = feeRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();

        for (Fee fee : fees) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", fee.getId());
            map.put("totalFee", fee.getTotalFee());
            map.put("paidAmount", fee.getPaidAmount());
            map.put("deadline", fee.getDeadline());
            map.put("dueAmount", fee.getDueAmount());
            map.put("lateFine", fee.getLateFine());
            map.put("totalDue", fee.getTotalDue());
            map.put("status", fee.getStatus());

            if (fee.getStudent() != null) {
                map.put("studentId", fee.getStudent().getId());
                map.put("studentName", fee.getStudent().getName());
                map.put("studentRollNo", fee.getStudent().getRollNo());
                map.put("studentEmail", fee.getStudent().getEmail());
            }
            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> addOrUpdateFee(@RequestBody Map<String, Object> body) {
        Long studentId = Long.valueOf(body.get("student_id").toString());
        Integer totalFee = Integer.valueOf(body.get("total_fee").toString());
        Integer paid = Integer.valueOf(body.get("paid").toString());
        String deadlineStr = (String) body.get("deadline");

        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Student not found"));
        }

        Student student = studentOpt.get();
        LocalDateTime deadline = LocalDateTime.parse(deadlineStr + "T00:00:00");

        List<Fee> existingFees = feeRepository.findByStudentId(studentId);
        Fee fee;

        if (!existingFees.isEmpty()) {
            fee = existingFees.get(0);
            fee.setTotalFee(totalFee);
            fee.setPaidAmount(paid);
            fee.setDeadline(deadline);
        } else {
            fee = new Fee();
            fee.setStudent(student);
            fee.setTotalFee(totalFee);
            fee.setPaidAmount(paid);
            fee.setDeadline(deadline);
        }

        Fee savedFee = feeRepository.save(fee);
        return ResponseEntity.ok(savedFee);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFee(@PathVariable Long id) {
        Optional<Fee> feeOpt = feeRepository.findById(id);
        if (feeOpt.isPresent()) {
            feeRepository.delete(feeOpt.get());
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentFeeRequirement(@PathVariable Long studentId) {
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Student student = studentOpt.get();

        // 1. Normalize course name (e.g., B.Tech -> B. Tech)
        String searchCourse = student.getCourse() != null ? student.getCourse().trim() : "";
        String cleanCourse = searchCourse.replaceAll("\\s+", "").toLowerCase();
        if (cleanCourse.contains("b.tech") || cleanCourse.contains("btech")) {
            searchCourse = "B. Tech";
        } else if (cleanCourse.contains("m.tech") || cleanCourse.contains("mtech")) {
            searchCourse = "M.Tech";
        } else if (cleanCourse.contains("mba")) {
            searchCourse = "MBA";
        } else if (cleanCourse.contains("mca")) {
            searchCourse = "MCA";
        } else if (cleanCourse.contains("bcca")) {
            searchCourse = "BCCA";
        } else if (cleanCourse.contains("bsc")) {
            searchCourse = "BSC";
        } else if (cleanCourse.contains("m.sc") || cleanCourse.contains("msc")) {
            searchCourse = "M.SC";
        } else if (cleanCourse.contains("polytechnic") || cleanCourse.contains("poly")) {
            searchCourse = "Polytechnic";
        }

        // 2. Normalize year mapping (First Year or Direct Second Yr.)
        String mappedYear = "First Year";
        String cleanYear = student.getYear() != null ? student.getYear().toUpperCase() : "";
        if (cleanYear.contains("DSY") || cleanYear.contains("DIRECT")) {
            mappedYear = "Direct Second Yr.";
        }

        // 3. Normalize branch mapping
        String searchBranch = student.getBranch() != null ? student.getBranch().trim().toLowerCase() : "";
        Map<String, String> branchMap = new LinkedHashMap<>();
        branchMap.put("aiml", "AI");
        branchMap.put("ai/ml", "AI");
        branchMap.put("ai", "AI");
        branchMap.put("computer science", "CSE");
        branchMap.put("information tech", "IT");
        branchMap.put("cyber security", "CYS");
        branchMap.put("artificial intelligence", "AI");
        branchMap.put("data science", "DSE");
        branchMap.put("electronics", "ETC");
        branchMap.put("mechanical", "ME");
        branchMap.put("civil", "CE");
        branchMap.put("electrical", "EE");
        branchMap.put("vlsi", "VLSI");
        branchMap.put("cad", "CAD/CAM");
        branchMap.put("srt", "SRT");

        boolean mapped = false;
        for (Map.Entry<String, String> entry : branchMap.entrySet()) {
            if (searchBranch.contains(entry.getKey())) {
                searchBranch = entry.getValue();
                mapped = true;
                break;
            }
        }
        
        if (!mapped) {
            // Keep original casing/capitalization if not mapped
            searchBranch = student.getBranch() != null ? student.getBranch().trim() : "";
        }

        Optional<FeeStructure> feeStructOpt = feeStructureRepository
                .findFirstByCourseAndYearAndBranchContainingIgnoreCase(searchCourse, mappedYear, searchBranch);

        if (feeStructOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("total_fee", 0, "message", "No specific fee structure found"));
        }

        FeeStructure struct = feeStructOpt.get();
        String cat = student.getCategory();
        double fee = 0;

        if ("Open".equalsIgnoreCase(cat)) fee = struct.getFeeOpen();
        else if ("OBC".equalsIgnoreCase(cat)) fee = struct.getFeeObc();
        else if ("VJ/NT".equalsIgnoreCase(cat)) fee = struct.getFeeVjnt();
        else if ("SC/ST".equalsIgnoreCase(cat)) fee = struct.getFeeScst();
        else if ("OMS".equalsIgnoreCase(cat)) fee = struct.getFeeOms();
        else if ("Mgmt.Quota".equalsIgnoreCase(cat)) fee = struct.getFeeMgmt();

        return ResponseEntity.ok(Map.of("total_fee", (int) fee));
    }

    @GetMapping("/structures")
    public ResponseEntity<List<FeeStructure>> getFeeStructures() {
        return ResponseEntity.ok(feeStructureRepository.findAll());
    }

    @PostMapping("/structures")
    public ResponseEntity<FeeStructure> addOrUpdateFeeStructure(@RequestBody FeeStructure structure) {
        return ResponseEntity.ok(feeStructureRepository.save(structure));
    }

    @DeleteMapping("/structures/{id}")
    public ResponseEntity<?> deleteFeeStructure(@PathVariable Long id) {
        if (feeStructureRepository.existsById(id)) {
            feeStructureRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.notFound().build();
    }
}
