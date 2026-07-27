using System;

public class Program
{
    public static void Main()
    {
        int[] values = new int[] { 1, 2, 3, 4 };
        int total = 0;
        foreach (int value in values)
        {
            total += value;
        }
        Console.WriteLine("cs_foreach " + total);
    }
}
