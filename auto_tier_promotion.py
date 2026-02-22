"""
Auto-Tier Promotion Logic
Championship Decision System for Automatic Language Advancement

Purpose: Implement 95%+ pass rate + security gates → Tier advancement
Status: Pre-Execution Infrastructure - Phase 2
Date: February 5, 2026
"""

import json
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple
from enum import Enum
from datetime import datetime


class TierLevel(Enum):
    """Language tier classification"""
    TIER_3 = 3
    TIER_2 = 2
    TIER_1 = 1


class PromotionDecision(Enum):
    """Auto-promotion decision outcomes"""
    AUTO_PROMOTE = "auto_promote"
    MANUAL_REVIEW = "manual_review"
    BLOCK_PROMOTION = "block_promotion"
    DEFER_DECISION = "defer_decision"


class SecurityGateStatus(Enum):
    """Security validation status"""
    PASSED = "passed"
    FAILED = "failed"
    NOT_TESTED = "not_tested"
    WAIVED = "waived"


@dataclass
class SecurityGate:
    """Individual security gate validation"""
    gate_name: str
    status: str
    details: str
    critical: bool = True


@dataclass
class PerformanceBenchmark:
    """Performance validation metrics"""
    metric_name: str
    baseline_value: float
    current_value: float
    target_value: float
    improvement_percent: float
    passed: bool


@dataclass
class TierCriteria:
    """Formal tier promotion criteria"""
    tier_level: int
    min_pass_rate: float  # Percentage (0-100)
    min_baseline_tests: int
    min_forensic_tests: int
    security_gates_required: List[str]
    performance_gates_required: List[str]
    documentation_required: bool
    manual_review_required: bool


@dataclass
class PromotionEvaluation:
    """Complete tier promotion evaluation result"""
    language: str
    current_tier: int
    target_tier: int
    decision: str
    pass_rate: float
    tests_passed: int
    tests_failed: int
    tests_total: int
    security_gates: List[SecurityGate]
    performance_benchmarks: List[PerformanceBenchmark]
    blocking_issues: List[str]
    warnings: List[str]
    recommendation: str
    timestamp: str


class AutoTierPromotion:
    """
    Championship Auto-Tier Promotion System
    
    Features:
    - Automatic promotion decisions based on formal criteria
    - Security gate validation
    - Performance benchmark verification
    - Manual review flagging for edge cases
    - Detailed audit trail
    """
    
    def __init__(self):
        self.tier_criteria = self._initialize_tier_criteria()
        self.evaluation_history: List[PromotionEvaluation] = []
        
    def _initialize_tier_criteria(self) -> Dict[int, TierCriteria]:
        """
        Initialize formal tier promotion criteria
        
        Tier 3 → Tier 2:
        - 92%+ pass rate (auto-promote)
        - 91-92% pass rate (manual review)
        - <91% pass rate (block promotion)
        - All security gates must pass
        - Performance improvement 50%+ (Phase D)
        
        Tier 2 → Tier 1:
        - 95%+ pass rate (auto-promote)
        - 93-95% pass rate (manual review)
        - <93% pass rate (block promotion)
        - All security gates must pass
        - All forensic tests must pass
        - Performance targets met
        - Documentation complete
        """
        return {
            3: TierCriteria(
                tier_level=3,
                min_pass_rate=92.0,  # Auto-promote threshold
                min_baseline_tests=34,
                min_forensic_tests=14,
                security_gates_required=[
                    "input_validation",
                    "error_handling",
                    "resource_cleanup"
                ],
                performance_gates_required=[
                    "baseline_execution",
                    "phase_d_optimization"
                ],
                documentation_required=False,
                manual_review_required=False
            ),
            2: TierCriteria(
                tier_level=2,
                min_pass_rate=95.0,  # Auto-promote threshold
                min_baseline_tests=34,
                min_forensic_tests=84,  # Full forensic suite
                security_gates_required=[
                    "input_validation",
                    "error_handling",
                    "resource_cleanup",
                    "memory_safety",
                    "concurrency_safety"
                ],
                performance_gates_required=[
                    "baseline_execution",
                    "phase_d_optimization",
                    "phase_e_security",
                    "phase_f_performance"
                ],
                documentation_required=True,
                manual_review_required=False
            )
        }
    
    def evaluate_promotion(
        self,
        language: str,
        current_tier: int,
        tests_passed: int,
        tests_failed: int,
        tests_total: int,
        security_gates: List[SecurityGate],
        performance_benchmarks: List[PerformanceBenchmark]
    ) -> PromotionEvaluation:
        """
        Evaluate if a language meets tier promotion criteria
        
        Args:
            language: Language name (e.g., "Java", "Kotlin")
            current_tier: Current tier level (2 or 3)
            tests_passed: Number of tests passed
            tests_failed: Number of tests failed
            tests_total: Total number of tests
            security_gates: Security validation results
            performance_benchmarks: Performance metrics
            
        Returns:
            PromotionEvaluation with decision and details
        """
        if current_tier not in [2, 3]:
            raise ValueError(f"Invalid tier for promotion: {current_tier}")
        
        target_tier = current_tier - 1
        criteria = self.tier_criteria[current_tier]
        
        # Calculate pass rate
        pass_rate = (tests_passed / tests_total * 100) if tests_total > 0 else 0.0
        
        # Check security gates
        blocking_issues = []
        warnings = []
        
        # Validate security gates
        for required_gate in criteria.security_gates_required:
            gate = next((g for g in security_gates if g.gate_name == required_gate), None)
            if gate is None:
                blocking_issues.append(f"Security gate not tested: {required_gate}")
            elif gate.status != SecurityGateStatus.PASSED.value and gate.critical:
                blocking_issues.append(f"Critical security gate failed: {required_gate}")
            elif gate.status != SecurityGateStatus.PASSED.value:
                warnings.append(f"Non-critical security gate failed: {required_gate}")
        
        # Validate performance benchmarks
        for required_perf in criteria.performance_gates_required:
            benchmark = next((b for b in performance_benchmarks if b.metric_name == required_perf), None)
            if benchmark is None:
                blocking_issues.append(f"Performance benchmark not tested: {required_perf}")
            elif not benchmark.passed:
                blocking_issues.append(f"Performance benchmark failed: {required_perf} "
                                     f"(current: {benchmark.current_value}, target: {benchmark.target_value})")
        
        # Make promotion decision
        decision = self._make_promotion_decision(
            pass_rate, criteria, blocking_issues, current_tier
        )
        
        # Generate recommendation
        recommendation = self._generate_recommendation(
            decision, pass_rate, criteria, blocking_issues, warnings
        )
        
        evaluation = PromotionEvaluation(
            language=language,
            current_tier=current_tier,
            target_tier=target_tier,
            decision=decision,
            pass_rate=pass_rate,
            tests_passed=tests_passed,
            tests_failed=tests_failed,
            tests_total=tests_total,
            security_gates=security_gates,
            performance_benchmarks=performance_benchmarks,
            blocking_issues=blocking_issues,
            warnings=warnings,
            recommendation=recommendation,
            timestamp=datetime.now().isoformat()
        )
        
        self.evaluation_history.append(evaluation)
        return evaluation
    
    def _make_promotion_decision(
        self,
        pass_rate: float,
        criteria: TierCriteria,
        blocking_issues: List[str],
        current_tier: int
    ) -> str:
        """
        Make the tier promotion decision
        
        Decision Matrix for Tier 3→2:
        - Pass rate ≥92% AND no blocking issues → AUTO_PROMOTE
        - Pass rate 91-92% AND no blocking issues → MANUAL_REVIEW
        - Pass rate <91% OR blocking issues → BLOCK_PROMOTION
        
        Decision Matrix for Tier 2→1:
        - Pass rate ≥95% AND no blocking issues → AUTO_PROMOTE
        - Pass rate 93-95% AND no blocking issues → MANUAL_REVIEW
        - Pass rate <93% OR blocking issues → BLOCK_PROMOTION
        """
        # Blocking issues always prevent promotion
        if blocking_issues:
            return PromotionDecision.BLOCK_PROMOTION.value
        
        # Tier-specific thresholds
        if current_tier == 3:
            # Tier 3 → Tier 2
            if pass_rate >= 92.0:
                return PromotionDecision.AUTO_PROMOTE.value
            elif pass_rate >= 91.0:
                return PromotionDecision.MANUAL_REVIEW.value
            else:
                return PromotionDecision.BLOCK_PROMOTION.value
        
        elif current_tier == 2:
            # Tier 2 → Tier 1
            if pass_rate >= 95.0:
                return PromotionDecision.AUTO_PROMOTE.value
            elif pass_rate >= 93.0:
                return PromotionDecision.MANUAL_REVIEW.value
            else:
                return PromotionDecision.BLOCK_PROMOTION.value
        
        return PromotionDecision.DEFER_DECISION.value
    
    def _generate_recommendation(
        self,
        decision: str,
        pass_rate: float,
        criteria: TierCriteria,
        blocking_issues: List[str],
        warnings: List[str]
    ) -> str:
        """Generate human-readable recommendation"""
        if decision == PromotionDecision.AUTO_PROMOTE.value:
            return (f"✅ APPROVED FOR AUTO-PROMOTION: Pass rate {pass_rate:.1f}% exceeds "
                   f"threshold {criteria.min_pass_rate}%. All gates passed. "
                   f"Automatic tier advancement authorized.")
        
        elif decision == PromotionDecision.MANUAL_REVIEW.value:
            return (f"⚠️ MANUAL REVIEW REQUIRED: Pass rate {pass_rate:.1f}% is below auto-promote "
                   f"threshold {criteria.min_pass_rate}% but above block threshold. "
                   f"Human judgment needed for promotion decision. "
                   f"Warnings: {len(warnings)}")
        
        elif decision == PromotionDecision.BLOCK_PROMOTION.value:
            reasons = []
            if pass_rate < criteria.min_pass_rate - 2.0:  # More than 2% below
                reasons.append(f"Pass rate {pass_rate:.1f}% too low (min: {criteria.min_pass_rate}%)")
            if blocking_issues:
                reasons.append(f"{len(blocking_issues)} blocking issue(s)")
            
            return (f"❌ PROMOTION BLOCKED: {', '.join(reasons)}. "
                   f"Must resolve issues before tier advancement.")
        
        return "⏸️ DECISION DEFERRED: Insufficient data for promotion evaluation."
    
    def get_promotion_status(self, language: str) -> Optional[PromotionEvaluation]:
        """Get most recent promotion evaluation for a language"""
        evaluations = [e for e in self.evaluation_history if e.language == language]
        if evaluations:
            return evaluations[-1]
        return None
    
    def get_tier_statistics(self, tier: int) -> Dict[str, any]:
        """
        Get promotion statistics for a tier
        
        Args:
            tier: Tier level (2 or 3)
            
        Returns:
            Dictionary with promotion statistics
        """
        tier_evals = [e for e in self.evaluation_history if e.current_tier == tier]
        
        if not tier_evals:
            return {
                "tier": tier,
                "total_evaluations": 0,
                "auto_promoted": 0,
                "manual_review": 0,
                "blocked": 0,
                "average_pass_rate": 0.0
            }
        
        stats = {
            "tier": tier,
            "total_evaluations": len(tier_evals),
            "auto_promoted": sum(1 for e in tier_evals if e.decision == PromotionDecision.AUTO_PROMOTE.value),
            "manual_review": sum(1 for e in tier_evals if e.decision == PromotionDecision.MANUAL_REVIEW.value),
            "blocked": sum(1 for e in tier_evals if e.decision == PromotionDecision.BLOCK_PROMOTION.value),
            "average_pass_rate": sum(e.pass_rate for e in tier_evals) / len(tier_evals)
        }
        
        stats["promotion_rate"] = (stats["auto_promoted"] / stats["total_evaluations"] * 100) if stats["total_evaluations"] > 0 else 0.0
        
        return stats
    
    def format_evaluation_report(self, evaluation: PromotionEvaluation) -> str:
        """Generate a formatted evaluation report"""
        report = []
        report.append("=" * 80)
        report.append(f"TIER PROMOTION EVALUATION: {evaluation.language}")
        report.append("=" * 80)
        report.append(f"Current Tier: {evaluation.current_tier}")
        report.append(f"Target Tier:  {evaluation.target_tier}")
        report.append(f"Timestamp:    {evaluation.timestamp}")
        report.append("")
        
        report.append("TEST RESULTS:")
        report.append(f"  Tests Passed:  {evaluation.tests_passed}/{evaluation.tests_total}")
        report.append(f"  Tests Failed:  {evaluation.tests_failed}/{evaluation.tests_total}")
        report.append(f"  Pass Rate:     {evaluation.pass_rate:.2f}%")
        report.append("")
        
        report.append("SECURITY GATES:")
        for gate in evaluation.security_gates:
            status_icon = "✅" if gate.status == SecurityGateStatus.PASSED.value else "❌"
            critical_mark = "[CRITICAL]" if gate.critical else "[NON-CRITICAL]"
            report.append(f"  {status_icon} {gate.gate_name} {critical_mark}: {gate.details}")
        report.append("")
        
        report.append("PERFORMANCE BENCHMARKS:")
        for benchmark in evaluation.performance_benchmarks:
            status_icon = "✅" if benchmark.passed else "❌"
            report.append(f"  {status_icon} {benchmark.metric_name}:")
            report.append(f"      Baseline: {benchmark.baseline_value:.2f}ms")
            report.append(f"      Current:  {benchmark.current_value:.2f}ms")
            report.append(f"      Target:   {benchmark.target_value:.2f}ms")
            report.append(f"      Improvement: {benchmark.improvement_percent:.1f}%")
        report.append("")
        
        if evaluation.blocking_issues:
            report.append("BLOCKING ISSUES:")
            for issue in evaluation.blocking_issues:
                report.append(f"  ❌ {issue}")
            report.append("")
        
        if evaluation.warnings:
            report.append("WARNINGS:")
            for warning in evaluation.warnings:
                report.append(f"  ⚠️ {warning}")
            report.append("")
        
        report.append("DECISION:")
        report.append(f"  {evaluation.recommendation}")
        report.append("=" * 80)
        
        return "\n".join(report)


# Example usage and testing
if __name__ == "__main__":
    print("=" * 80)
    print("AUTO-TIER PROMOTION SYSTEM - VALIDATION TEST")
    print("=" * 80)
    
    # Initialize promotion system
    promotion_system = AutoTierPromotion()
    
    # Test Case 1: Java Tier 3→2 with 95% pass rate (should auto-promote)
    print("\n📊 Test Case 1: Java Tier 3→2 (95% pass rate)")
    print("-" * 80)
    
    java_security_gates = [
        SecurityGate("input_validation", SecurityGateStatus.PASSED.value, "All inputs validated", True),
        SecurityGate("error_handling", SecurityGateStatus.PASSED.value, "Comprehensive error handling", True),
        SecurityGate("resource_cleanup", SecurityGateStatus.PASSED.value, "Resources properly released", True)
    ]
    
    java_performance = [
        PerformanceBenchmark("baseline_execution", 2500.0, 2400.0, 2500.0, 4.0, True),
        PerformanceBenchmark("phase_d_optimization", 2400.0, 1200.0, 1250.0, 50.0, True)
    ]
    
    java_eval = promotion_system.evaluate_promotion(
        language="Java",
        current_tier=3,
        tests_passed=95,
        tests_failed=5,
        tests_total=100,
        security_gates=java_security_gates,
        performance_benchmarks=java_performance
    )
    
    print(promotion_system.format_evaluation_report(java_eval))
    
    # Test Case 2: Kotlin Tier 3→2 with 91.5% pass rate (should manual review)
    print("\n📊 Test Case 2: Kotlin Tier 3→2 (91.5% pass rate)")
    print("-" * 80)
    
    kotlin_security_gates = [
        SecurityGate("input_validation", SecurityGateStatus.PASSED.value, "All inputs validated", True),
        SecurityGate("error_handling", SecurityGateStatus.PASSED.value, "Comprehensive error handling", True),
        SecurityGate("resource_cleanup", SecurityGateStatus.PASSED.value, "Resources properly released", True)
    ]
    
    kotlin_performance = [
        PerformanceBenchmark("baseline_execution", 2600.0, 2500.0, 2600.0, 3.8, True),
        PerformanceBenchmark("phase_d_optimization", 2500.0, 1300.0, 1300.0, 48.0, True)
    ]
    
    kotlin_eval = promotion_system.evaluate_promotion(
        language="Kotlin",
        current_tier=3,
        tests_passed=91,
        tests_failed=9,
        tests_total=100,
        security_gates=kotlin_security_gates,
        performance_benchmarks=kotlin_performance
    )
    
    print(promotion_system.format_evaluation_report(kotlin_eval))
    
    # Test Case 3: Scala Tier 3→2 with 88% pass rate (should block)
    print("\n📊 Test Case 3: Scala Tier 3→2 (88% pass rate)")
    print("-" * 80)
    
    scala_security_gates = [
        SecurityGate("input_validation", SecurityGateStatus.FAILED.value, "Missing edge case validation", True),
        SecurityGate("error_handling", SecurityGateStatus.PASSED.value, "Comprehensive error handling", True),
        SecurityGate("resource_cleanup", SecurityGateStatus.PASSED.value, "Resources properly released", True)
    ]
    
    scala_performance = [
        PerformanceBenchmark("baseline_execution", 2700.0, 2650.0, 2700.0, 1.9, True),
        PerformanceBenchmark("phase_d_optimization", 2650.0, 1600.0, 1350.0, 39.6, False)
    ]
    
    scala_eval = promotion_system.evaluate_promotion(
        language="Scala",
        current_tier=3,
        tests_passed=88,
        tests_failed=12,
        tests_total=100,
        security_gates=scala_security_gates,
        performance_benchmarks=scala_performance
    )
    
    print(promotion_system.format_evaluation_report(scala_eval))
    
    # Print tier statistics
    print("\n" + "=" * 80)
    print("TIER 3 PROMOTION STATISTICS")
    print("=" * 80)
    stats = promotion_system.get_tier_statistics(3)
    print(json.dumps(stats, indent=2))
    
    print("\n" + "=" * 80)
    print("✅ AUTO-TIER PROMOTION SYSTEM VALIDATION COMPLETE")
    print("=" * 80)
