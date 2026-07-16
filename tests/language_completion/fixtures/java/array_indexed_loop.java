public class ArrayIndexedLoop {
    public static void main(String[] args) {
        int[] values = {2, 4, 6};
        values[1] = values[0] + values[2];
        int total = 0;
        for (int i = 0; i < values.length; i += 1) {
            total += values[i];
        }
        System.out.println("java_array_index");
        System.out.println(total);
    }
}
