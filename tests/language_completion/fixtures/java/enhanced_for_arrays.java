public class EnhancedForArrays {
    public static int sum(int[] values) {
        int total = 0;
        for (int value : values) {
            total += value;
        }
        return total;
    }

    public static void main(String[] args) {
        int[] values = new int[] {3, 5, 7};
        System.out.println("java_enhanced_for");
        System.out.println(sum(values));
    }
}
