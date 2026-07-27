using System;
using System.Threading.Tasks;

public class Program
{
    public static async Task Main()
    {
        await Task.Delay(1);
        Console.WriteLine("async");
    }
}
