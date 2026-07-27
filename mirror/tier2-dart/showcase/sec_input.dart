// MIRROR V3: Tier 2 Dart Showcase
// Category: Security
// Module: sec_input.dart

bool validateInput(String value, Map<String, dynamic> rules) {
  if ((rules['minLength'] as int?) != null) {
    if (value.length < (rules['minLength'] as int)) return false;
  }
  
  if ((rules['maxLength'] as int?) != null) {
    if (value.length > (rules['maxLength'] as int)) return false;
  }
  
  if ((rules['notEmpty'] as bool?) == true) {
    if (value.isEmpty) return false;
  }
  
  if ((rules['alphanumeric'] as bool?) == true) {
    if (!RegExp(r'^[a-zA-Z0-9]+$').hasMatch(value)) return false;
  }
  
  return true;
}

String sanitizeInput(String value) {
  final dangerous = ['<', '>', '"', "'", '&', ';'];
  String result = value;
  for (final char in dangerous) {
    result = result.replaceAll(char, '');
  }
  return result.trim();
}

bool validateEmail(String email) {
  return RegExp(r'^[^@]+@[^@]+\.[^@]+$').hasMatch(email);
}

void main() {
  final result = <String, dynamic>{
    'validHello': validateInput('hello', {'minLength': 3, 'maxLength': 10}),
    'invalidShort': validateInput('hi', {'minLength': 3}),
    'invalidEmpty': validateInput('', {'notEmpty': true}),
    'sanitized': sanitizeInput('hello<script>'),
    'validEmail': validateEmail('user@example.com'),
    'inputValidationActive': true,
  };
  print(result);
}
