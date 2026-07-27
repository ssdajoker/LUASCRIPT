public class MathCalls {
    public static double hyp(double a, double b) {
        return Math.sqrt(a * a + b * b);
    }

    public static void main(String[] args) {
        double value = hyp(3, 4);
        System.out.println("java_math");
        System.out.println(value);
    }
}
