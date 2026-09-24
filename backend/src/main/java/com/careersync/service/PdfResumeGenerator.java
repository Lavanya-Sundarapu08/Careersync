package com.careersync.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class PdfResumeGenerator {

    public static byte[] generate(
            String candidateName,
            String candidateEmail,
            String jobTitle,
            String companyName,
            int atsScore,
            String fitCategory,
            List<String> matchedSkills,
            List<String> missingSkills,
            List<String> suggestedQuestions
    ) {
        try {
            ByteArrayOutputStream streamContent = new ByteArrayOutputStream();
            StringBuilder s = new StringBuilder();

            // Text stream commands for PDF
            s.append("BT\n");
            
            // Header: CareerSync Verified Dossier
            s.append("/F1 18 Tf\n");
            s.append("50 740 Td\n");
            s.append("(").append(escape(candidateName)).append(" - Candidate CV) Tj\n");

            // Subtitle: Role & Company
            s.append("/F2 11 Tf\n");
            s.append("0 -20 Td\n");
            s.append("(Role: ").append(escape(jobTitle)).append(" | Company: ").append(escape(companyName)).append(") Tj\n");

            // Contact
            s.append("/F2 10 Tf\n");
            s.append("0 -16 Td\n");
            s.append("(Email: ").append(escape(candidateEmail)).append(" | Verified Candidate ID: CareerSync) Tj\n");

            // Horizontal line / section divider
            s.append("ET\n");
            s.append("q 0.2 0.4 0.8 rg 50 685 512 2 re f Q\n");
            s.append("BT\n");

            // ATS Score Section
            s.append("/F1 13 Tf\n");
            s.append("50 660 Td\n");
            s.append("(ATS SCREENING ASSESSMENT & SCORECARD) Tj\n");

            s.append("/F2 10 Tf\n");
            s.append("0 -18 Td\n");
            s.append("(Relevancy Fit: ").append(atsScore).append("% Match - ")
                    .append(escape(fitCategory.replace('_', ' '))).append(") Tj\n");

            // Matched Skills
            s.append("/F1 11 Tf\n");
            s.append("0 -22 Td\n");
            s.append("(Core Validated Skills:) Tj\n");

            s.append("/F2 10 Tf\n");
            s.append("0 -15 Td\n");
            String matched = matchedSkills == null || matchedSkills.isEmpty() ? "None specified" : String.join(", ", matchedSkills);
            s.append("(").append(escape(matched)).append(") Tj\n");

            // Growth / Gap areas
            s.append("/F1 11 Tf\n");
            s.append("0 -22 Td\n");
            s.append("(Identified Growth / Gap Areas:) Tj\n");

            s.append("/F2 10 Tf\n");
            s.append("0 -15 Td\n");
            String missing = missingSkills == null || missingSkills.isEmpty() ? "No critical gaps identified" : String.join(", ", missingSkills);
            s.append("(").append(escape(missing)).append(") Tj\n");

            // Section divider
            s.append("ET\n");
            s.append("q 0.85 0.85 0.85 rg 50 540 512 1 re f Q\n");
            s.append("BT\n");

            // Tailored Interview Questions
            s.append("/F1 13 Tf\n");
            s.append("50 515 Td\n");
            s.append("(RECOMMENDED INTERVIEW QUESTIONS) Tj\n");

            s.append("/F2 9 Tf\n");
            int yOffset = -18;
            if (suggestedQuestions != null && !suggestedQuestions.isEmpty()) {
                for (int i = 0; i < suggestedQuestions.size(); i++) {
                    s.append("0 ").append(yOffset).append(" Td\n");
                    s.append("(").append(i + 1).append(". ").append(escape(suggestedQuestions.get(i))).append(") Tj\n");
                    yOffset = -16;
                }
            } else {
                s.append("0 -18 Td\n");
                s.append("(Standard behavioral and system design interview loop recommended.) Tj\n");
            }

            // Summary Section
            s.append("ET\n");
            s.append("q 0.85 0.85 0.85 rg 50 400 512 1 re f Q\n");
            s.append("BT\n");

            s.append("/F1 13 Tf\n");
            s.append("50 375 Td\n");
            s.append("(CANDIDATE PROFILE SUMMARY) Tj\n");

            s.append("/F2 10 Tf\n");
            s.append("0 -18 Td\n");
            s.append("(Proven software engineering background with direct expertise in backend systems.) Tj\n");
            s.append("0 -15 Td\n");
            s.append("(Evaluated under CareerSync progressive disclosure SLA pipeline.) Tj\n");
            s.append("0 -15 Td\n");
            s.append("(Unlocked for hiring manager evaluation upon reaching SHORTLISTED status.) Tj\n");

            // Footer
            s.append("/F2 8 Tf\n");
            s.append("0 -40 Td\n");
            s.append("(CareerSync SLA-Driven Recruitment Engine - Verified Candidate Dossier) Tj\n");

            s.append("ET\n");

            byte[] contentBytes = s.toString().getBytes(StandardCharsets.US_ASCII);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            List<Long> offsets = new ArrayList<>();

            out.write("%PDF-1.4\n".getBytes(StandardCharsets.US_ASCII));
            out.write("%\u00E2\u00E3\u00CF\u00D3\n".getBytes(StandardCharsets.ISO_8859_1));

            // 1 0 obj: Catalog
            offsets.add((long) out.size());
            out.write("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // 2 0 obj: Pages
            offsets.add((long) out.size());
            out.write("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // 3 0 obj: Page
            offsets.add((long) out.size());
            out.write(("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] " +
                    "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> " +
                    "/Contents 6 0 R >>\nendobj\n").getBytes(StandardCharsets.US_ASCII));

            // 4 0 obj: Font F1 (Bold)
            offsets.add((long) out.size());
            out.write("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // 5 0 obj: Font F2 (Regular)
            offsets.add((long) out.size());
            out.write("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // 6 0 obj: Content Stream
            offsets.add((long) out.size());
            out.write(("6 0 obj\n<< /Length " + contentBytes.length + " >>\nstream\n").getBytes(StandardCharsets.US_ASCII));
            out.write(contentBytes);
            out.write("\nendstream\nendobj\n".getBytes(StandardCharsets.US_ASCII));

            // xref
            long startXref = out.size();
            out.write(("xref\n0 " + (offsets.size() + 1) + "\n").getBytes(StandardCharsets.US_ASCII));
            out.write("0000000000 65535 f \n".getBytes(StandardCharsets.US_ASCII));
            for (Long offset : offsets) {
                out.write(String.format("%010d 00000 n \n", offset).getBytes(StandardCharsets.US_ASCII));
            }

            // trailer
            out.write(("trailer\n<< /Size " + (offsets.size() + 1) + " /Root 1 0 R >>\n").getBytes(StandardCharsets.US_ASCII));
            out.write("startxref\n".getBytes(StandardCharsets.US_ASCII));
            out.write((startXref + "\n%%EOF\n").getBytes(StandardCharsets.US_ASCII));

            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate candidate resume PDF", e);
        }
    }

    private static String escape(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)")
                .replaceAll("[^\\x20-\\x7E]", " ");
    }
}
