using System;

public class Program
{
    public static void Main()
    {
        int total = 8;
        bool ready = true;
        string label = "blocked";
        if (ready && total == 8)
        {
            label = "ready";
        }
        Console.WriteLine("cs_bool " + label);
    }
}
