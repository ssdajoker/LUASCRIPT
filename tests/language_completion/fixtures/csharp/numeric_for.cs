using System;

public class Program
{
    public static void Main()
    {
        int total = 0;
        for (int index = 1; index <= 4; index++)
        {
            total += index;
        }
        Console.WriteLine("cs_for " + total);
    }
}
