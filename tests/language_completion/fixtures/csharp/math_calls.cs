using System;

public class Program
{
    public static void Main()
    {
        int high = Math.Max(4, 9);
        int low = Math.Min(-4, 9);
        int absolute = Math.Abs(low);
        Console.WriteLine("cs_math " + high + " " + low + " " + absolute);
    }
}
