
import { z } from 'zod';

const schema = z.object({
    developerEmail: z.string().email().optional().nullable(),
});

function test(val: any) {
    const result = schema.safeParse({ developerEmail: val });
    console.log(`Value: "${val}" (${typeof val}) -> Success: ${result.success}`);
    if (!result.success) {
        console.log('Error:', result.error.issues[0].message);
    }
}

console.log('--- Testing Zod Email Validation ---');
test("");
test(null);
test(undefined);
test("test@example.com");
