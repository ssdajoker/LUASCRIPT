using System;
using System.Linq;

public class Program
{
    public static void Main()
    {
        var values = new int[] { 1, 2, 3 };
        var selected = from value in values where value > 1 select value;
        Console.WriteLine(selected);
    }
}
