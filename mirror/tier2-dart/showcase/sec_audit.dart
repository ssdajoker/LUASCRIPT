// MIRROR V3: Tier 2 Dart Showcase
// Category: Security
// Module: sec_audit.dart

class AuditLog {
  final List<Map<String, dynamic>> _entries = [];
  
  int logEvent(String eventType, String details) {
    _entries.add({
      'type': eventType,
      'details': details,
      'timestamp': DateTime.now().toIso8601String(),
    });
    return _entries.length;
  }
  
  int getCount() => _entries.length;
  
  List<Map<String, dynamic>> getEventsByType(String eventType) {
    return _entries.where((e) => e['type'] == eventType).toList();
  }
}

bool checkSecurity(AuditLog audit, String operation) {
  audit.logEvent('security_check', operation);
  
  if (operation == 'admin_access') {
    audit.logEvent('warning', 'admin access attempted');
    return false;
  }
  
  return true;
}

void main() {
  final audit = AuditLog();
  audit.logEvent('startup', 'system initialized');
  audit.logEvent('login', 'user authenticated');
  audit.logEvent('access', 'admin access attempted');
  audit.logEvent('warning', 'multiple failed login attempts');
  
  checkSecurity(audit, 'read_data');
  checkSecurity(audit, 'admin_access');
  
  final result = <String, dynamic>{
    'totalEvents': audit.getCount(),
    'startupEvents': audit.getEventsByType('startup').length,
    'warningEvents': audit.getEventsByType('warning').length,
    'adminBlocked': !checkSecurity(audit, 'admin_access'),
    'auditingActive': true,
  };
  print(result);
}
