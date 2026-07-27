public class ControlFlow {
    public static int sumTo(int limit) {
        int index = 0;
        int total = 0;
        while (index < limit) {
            total += index;
            index += 1;
        }
        if (total > 5) {
            return total;
        }
        return 0;
    }

    public static void main(String[] args) {
        System.out.println("java_flow");
        System.out.println(sumTo(5));
    }
}
