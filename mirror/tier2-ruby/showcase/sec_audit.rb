# MIRROR V3: Tier 2 Ruby Showcase
# Category: Security
# Module: sec_audit.rb
# Purpose: Demonstrate security auditing

class AuditLog
  def initialize
    @entries = []
  end
  
  def log_event(event_type, details)
    entry = {
      type: event_type,
      details: details,
      timestamp: Time.now.iso8601,
    }
    @entries << entry
    @entries.size
  end
  
  def get_count
    @entries.size
  end
  
  def get_events_by_type(event_type)
    @entries.select { |e| e[:type] == event_type }
  end
end

audit = AuditLog.new
audit.log_event("startup", "system initialized")
audit.log_event("login", "user authenticated")
audit.log_event("access", "admin access attempted")
audit.log_event("warning", "multiple failed login attempts")

def check_security(audit, operation)
  audit.log_event("security_check", operation)
  
  if operation == "admin_access"
    audit.log_event("warning", "admin access attempted")
    return false
  end
  
  true
end

check_security(audit, "read_data")
check_security(audit, "admin_access")

result = {
  total_events: audit.get_count,
  startup_events: audit.get_events_by_type("startup").size,
  warning_events: audit.get_events_by_type("warning").size,
  admin_blocked: !check_security(audit, "admin_access"),
  auditing_active: true,
}

puts result.inspect
