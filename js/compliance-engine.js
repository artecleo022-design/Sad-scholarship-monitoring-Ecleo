/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Core Compliance Evaluation Engine
 * 
 * Implements:
 * - Requirement 10: Automated Compliance Evaluation
 * - Requirement 11: Deficiency Identification & Explanation
 * - Business Rules: BR-01 to BR-10
 */

window.ComplianceEngine = (function() {
  
  /**
   * Retrieves the active institutional grading scale configuration
   */
  function getActiveGradingScale() {
    const savedScaleKey = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.GRADING_SCALE) || window.APP_CONFIG.DEFAULT_GRADING_SCALE;
    return window.APP_CONFIG.GRADING_SCALES[savedScaleKey] || window.APP_CONFIG.GRADING_SCALES.PH_1_TO_5;
  }

  /**
   * Evaluates academic compliance of a grade submission against assigned scholarship requirements
   * 
   * @param {Object} submission - Grade submission object (must be verified)
   * @param {Object} scholarship - Scholarship program requirements object
   * @returns {Object} Complete evaluation report
   */
  function evaluate(submission, scholarship) {
    if (!submission) {
      throw new Error("Invalid submission record provided for evaluation.");
    }
    if (!scholarship) {
      throw new Error("Scholarship program definition not found for this scholar.");
    }
    if (submission.submission_status !== "Verified") {
      throw new Error("Business Rule BR-05 Violation: Only VERIFIED grade submissions may be used for final compliance evaluation.");
    }

    const gradingScale = getActiveGradingScale();
    const deficiencies = [];

    // 1. GWA Evaluation
    // Based on institution grading scale:
    // If lowerIsBetter (e.g. PH 1.00-5.00), scholar's GWA must be <= required GWA (e.g. 1.45 <= 1.75 is compliant).
    // If higherIsBetter (e.g. US 4.00), scholar's GWA must be >= required GWA (e.g. 3.8 >= 3.5 is compliant).
    let gwaMet = false;
    const scholarGwa = parseFloat(submission.gwa);
    const requiredGwa = parseFloat(scholarship.required_gwa);

    if (gradingScale.lowerIsBetter) {
      gwaMet = scholarGwa <= requiredGwa;
      if (!gwaMet) {
        deficiencies.push(`GWA requirement not satisfied: Achieved ${scholarGwa.toFixed(2)}, but ${requiredGwa.toFixed(2)} or better is required (on a ${gradingScale.name} where lower is better).`);
      }
    } else {
      gwaMet = scholarGwa >= requiredGwa;
      if (!gwaMet) {
        deficiencies.push(`GPA requirement not satisfied: Achieved ${scholarGwa.toFixed(2)}, but minimum ${requiredGwa.toFixed(2)} is required.`);
      }
    }

    // 2. Minimum Units Evaluation
    const unitsEnrolled = parseInt(submission.units_enrolled, 10) || 0;
    const minUnits = parseInt(scholarship.min_units, 10) || 0;
    const unitsMet = unitsEnrolled >= minUnits;

    if (!unitsMet) {
      deficiencies.push(`Minimum units requirement not satisfied: Enrolled in ${unitsEnrolled} units, but a minimum of ${minUnits} units is required.`);
    }

    // 3. Failing Grade Policy Evaluation
    const failedSubjects = parseInt(submission.failed_subjects, 10) || 0;
    let failingPolicyMet = true;

    if (!scholarship.allow_failing_grade) {
      if (failedSubjects > 0) {
        failingPolicyMet = false;
        deficiencies.push(`Failing grade policy violated: Incurred ${failedSubjects} failing subject(s), but this scholarship strictly prohibits failing grades.`);
      }
    } else {
      // Allowed according to policy, but note if excessive (> 1)
      if (failedSubjects > 1) {
        failingPolicyMet = false;
        deficiencies.push(`Failing grade policy exceeded: Incurred ${failedSubjects} failing subjects (maximum 1 permitted under probationary conditional grant).`);
      }
    }

    // 4. Incomplete Subjects Check
    const incompleteSubjects = parseInt(submission.incomplete_subjects, 10) || 0;
    if (incompleteSubjects > 0) {
      deficiencies.push(`Subject requirement notice: Has ${incompleteSubjects} Incomplete (INC) subject(s) pending resolution.`);
    }

    // Overall Compliance Result (Requirement 10 & 11)
    const isCompliant = gwaMet && unitsMet && failingPolicyMet;
    const result = isCompliant ? "Compliant" : "With Deficiency";

    // Determine target Scholar Status (Requirement 12)
    let suggestedScholarStatus = isCompliant ? "Compliant" : "With Deficiency";
    if (isCompliant && (submission.semester === "2nd Semester" || submission.semester === "Summer Term")) {
      // In end-of-academic-year terms, compliant scholars qualify for renewal monitoring
      suggestedScholarStatus = "For Renewal";
    }

    return {
      result: result,
      isCompliant: isCompliant,
      gwa_requirement_met: gwaMet,
      units_requirement_met: unitsMet,
      failing_grade_requirement_met: failingPolicyMet,
      deficiencies: deficiencies,
      deficiency_details: deficiencies.length > 0 ? deficiencies.join(" • ") : "All academic compliance requirements fully satisfied.",
      evaluated_at: new Date().toISOString(),
      grading_scale_used: gradingScale.name,
      suggested_scholar_status: suggestedScholarStatus,
      comparison_summary: {
        gwa: {
          achieved: scholarGwa,
          required: requiredGwa,
          passed: gwaMet,
          scaleRule: gradingScale.lowerIsBetter ? "Must be <= required" : "Must be >= required"
        },
        units: {
          achieved: unitsEnrolled,
          required: minUnits,
          passed: unitsMet
        },
        failingGrades: {
          incurred: failedSubjects,
          allowed: scholarship.allow_failing_grade ? "Yes (Conditional)" : "No (Strict)",
          passed: failingPolicyMet
        }
      }
    };
  }

  return {
    evaluate: evaluate,
    getActiveGradingScale: getActiveGradingScale
  };
})();
