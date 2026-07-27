using System;

public class Program
{
    public static void Main()
    {
        int total = 0;
        int index = 0;
        while (index < 4)
        {
            total += index;
            index++;
        }
        Console.WriteLine("cs_while " + total);
    }
}
