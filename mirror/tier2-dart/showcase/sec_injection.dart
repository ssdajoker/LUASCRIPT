// MIRROR V3: Tier 2 Dart Showcase
// Category: Security
// Module: sec_injection.dart

String escapeSql(String value) {
  return value
      .replaceAll("'", "''")
      .replaceAll('"', '""')
      .replaceAll('\\', '\\\\');
}

bool validateQuery(String query) {
  final forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER'];
  final upperQuery = query.toUpperCase();
  
  for (final keyword in forbidden) {
    if (upperQuery.contains(keyword)) {
      return false;
    }
  }
  
  return true;
}

String sanitizeHtml(String content) {
  var result = content;
  result = result.replaceAll(RegExp(r'<script[^>]*>.*?</script>', caseSensitive: false), '');
  result = result.replaceAll(RegExp(r'on\w+\s*=', caseSensitive: false), '');
  return result;
}

void main() {
  final result = <String, dynamic>{
    'escapedQuote': escapeSql("user's name"),
    'validSelect': validateQuery('SELECT * FROM users'),
    'invalidDrop': validateQuery('DROP TABLE users'),
    'invalidDelete': validateQuery('DELETE FROM data'),
    'sanitizedHtml': sanitizeHtml('hello<script>alert(1)</script>'),
    'injectionPreventionActive': true,
  };
  print(result);
}
