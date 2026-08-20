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
        String rawCourse = student.getCourse() != null ? student.getCourse().trim() : "";
        String cleanCourse = rawCourse.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        String searchCourse = "B. Tech";

        if (cleanCourse.contains("btech") || cleanCourse.contains("be")) {
            searchCourse = "B. Tech";
        } else if (cleanCourse.contains("mtech") || cleanCourse.contains("me")) {
            searchCourse = "M.Tech";
        } else if (cleanCourse.contains("mba")) {
            searchCourse = "MBA";
        } else if (cleanCourse.contains("mca")) {
            searchCourse = "MCA";
        } else if (cleanCourse.contains("bcca")) {
            searchCourse = "BCCA";
        } else if (cleanCourse.contains("msc")) {
            searchCourse = "M.SC";
        } else if (cleanCourse.contains("bsc")) {
            searchCourse = "BSC";
        } else if (cleanCourse.contains("polytechnic") || cleanCourse.contains("poly") || cleanCourse.contains("diploma")) {
            searchCourse = "Polytechnic";
        } else if (!rawCourse.isEmpty()) {
            searchCourse = rawCourse;
        }

        // 2. Normalize year mapping (First Year or Direct Second Yr.)
        String mappedYear = "First Year";
        String cleanYear = student.getYear() != null ? student.getYear().toUpperCase() : "";
        if (cleanYear.contains("DSY") || cleanYear.contains("DIRECT") || cleanYear.contains("2ND") || cleanYear.contains("SECOND")) {
            mappedYear = "Direct Second Yr.";
        }

        // 3. Normalize branch mapping
        String rawBranch = student.getBranch() != null ? student.getBranch().trim() : "";
        String cleanBranch = rawBranch.toLowerCase();
        String searchBranch = rawBranch;

        if (cleanBranch.contains("ai") || cleanBranch.contains("aiml") || cleanBranch.contains("artificial")) {
            searchBranch = "AI";
        } else if (cleanBranch.contains("comp") || cleanBranch.contains("cse") || cleanBranch.contains("cs")) {
            searchBranch = "CSE";
        } else if (cleanBranch.contains("cyber") || cleanBranch.contains("cys")) {
            searchBranch = "CYS";
        } else if (cleanBranch.contains("data") || cleanBranch.contains("dse")) {
            searchBranch = "DSE";
        } else if (cleanBranch.contains("info") || cleanBranch.contains("it")) {
            searchBranch = "IT";
        } else if (cleanBranch.contains("electr") || cleanBranch.contains("etc") || cleanBranch.contains("ece")) {
            searchBranch = "ETC";
        } else if (cleanBranch.contains("elect") || cleanBranch.contains("ee")) {
            searchBranch = "EE";
        } else if (cleanBranch.contains("mech") || cleanBranch.contains("me")) {
            searchBranch = "ME";
        } else if (cleanBranch.contains("civil") || cleanBranch.contains("ce")) {
            searchBranch = "CE";
        }

        // Multi-level fallback matching:
        // Level 1: Course + Year + Branch
        Optional<FeeStructure> feeStructOpt = feeStructureRepository
                .findFirstByCourseAndYearAndBranchContainingIgnoreCase(searchCourse, mappedYear, searchBranch);

        // Level 2: Course + Branch (any year)
        if (feeStructOpt.isEmpty()) {
            List<FeeStructure> courseStructures = feeStructureRepository.findAll();
            feeStructOpt = courseStructures.stream()
                    .filter(s -> s.getCourse().equalsIgnoreCase(searchCourse) && s.getBranch().toUpperCase().contains(searchBranch.toUpperCase()))
                    .findFirst();
        }

        // Level 3: Just Course (first matching course fee)
        if (feeStructOpt.isEmpty()) {
            List<FeeStructure> courseStructures = feeStructureRepository.findAll();
            feeStructOpt = courseStructures.stream()
                    .filter(s -> s.getCourse().equalsIgnoreCase(searchCourse))
                    .findFirst();
        }

        if (feeStructOpt.isEmpty()) {
            // Fallback: If still not found, pick first available fee structure or default amount
            List<FeeStructure> all = feeStructureRepository.findAll();
            if (!all.isEmpty()) {
                feeStructOpt = Optional.of(all.get(0));
            } else {
                return ResponseEntity.ok(Map.of("total_fee", 138745, "message", "Default fee applied"));
            }
        }

        FeeStructure struct = feeStructOpt.get();
        String cat = student.getCategory() != null ? student.getCategory().trim().toUpperCase() : "OPEN";
        double fee = struct.getFeeOpen();

        if (cat.contains("OBC")) {
            fee = struct.getFeeObc() != null ? struct.getFeeObc() : struct.getFeeOpen();
        } else if (cat.contains("VJ") || cat.contains("NT")) {
            fee = struct.getFeeVjnt() != null ? struct.getFeeVjnt() : struct.getFeeOpen();
        } else if (cat.contains("SC") || cat.contains("ST")) {
            fee = struct.getFeeScst() != null ? struct.getFeeScst() : struct.getFeeOpen();
        } else if (cat.contains("OMS")) {
            fee = struct.getFeeOms() != null ? struct.getFeeOms() : struct.getFeeOpen();
        } else if (cat.contains("MGMT") || cat.contains("MANAGEMENT")) {
            fee = struct.getFeeMgmt() != null ? struct.getFeeMgmt() : struct.getFeeOpen();
        } else {
            fee = struct.getFeeOpen() != null ? struct.getFeeOpen() : 138745;
        }

        return ResponseEntity.ok(Map.of("total_fee", (int) Math.round(fee)));
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
