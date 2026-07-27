"""
MIRROR V3: Tier 2 Python Showcase
Category: Security
Module: sec_audit.py
Purpose: Demonstrate security auditing
"""

from datetime import datetime
from typing import Dict, List


class AuditLog:
    """Security audit log"""
    def __init__(self):
        self.entries: List[Dict] = []
    
    def log_event(self, event_type: str, details: str) -> int:
        """Log security event"""
        entry = {
            "type": event_type,
            "details": details,
            "timestamp": datetime.now().isoformat(),
        }
        self.entries.append(entry)
        return len(self.entries)
    
    def get_count(self) -> int:
        """Get total events"""
        return len(self.entries)
    
    def get_events_by_type(self, event_type: str) -> List[Dict]:
        """Get events by type"""
        return [e for e in self.entries if e["type"] == event_type]


audit = AuditLog()
audit.log_event("startup", "system initialized")
audit.log_event("login", "user authenticated")
audit.log_event("access", "admin access attempted")
audit.log_event("warning", "multiple failed login attempts")


def check_security(operation: str) -> bool:
    """Check security and log"""
    audit.log_event("security_check", operation)
    
    if operation == "admin_access":
        audit.log_event("warning", "admin access attempted")
        return False
    
    return True


check_security("read_data")
check_security("admin_access")

result = {
    "total_events": audit.get_count(),
    "startup_events": len(audit.get_events_by_type("startup")),
    "warning_events": len(audit.get_events_by_type("warning")),
    "admin_blocked": not check_security("admin_access"),
    "auditing_active": True,
}

if __name__ == "__main__":
    print(result)
