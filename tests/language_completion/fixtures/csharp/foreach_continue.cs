using System;

public class Program
{
    public static void Main()
    {
        int[] values = new int[] { 1, 2, 3, 4, 5 };
        int total = 0;
        foreach (int value in values)
        {
            if (value == 3)
            {
                continue;
            }
            total += value;
        }
        Console.WriteLine("cs_foreach_continue " + total);
    }
}
