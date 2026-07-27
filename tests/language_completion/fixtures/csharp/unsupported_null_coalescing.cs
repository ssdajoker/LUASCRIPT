using System;

public class Program
{
    public static void Main()
    {
        string value = null;
        string fallback = value ?? "fallback";
        Console.WriteLine(fallback);
    }
}
