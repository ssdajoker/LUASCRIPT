using System;

public class Program
{
    public static void Main()
    {
        int total = 0;
        foreach (int value in new int[] { 1, 2, 3 })
        {
            total += value;
        }
        Console.WriteLine(total);
    }
}
