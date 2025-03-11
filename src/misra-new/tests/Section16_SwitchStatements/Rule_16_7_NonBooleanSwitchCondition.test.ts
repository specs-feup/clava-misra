import { countErrorsAfterCorrection, countMISRAErrors, registerSourceCode, TestFile } from "../utils.js";

const passingCode = 
`void foo16_7_1( int num )
{
    switch (num) { 
        case 0:
            num *= 2;
            break;
        case 1:
            num += 5;
            break;
        default:
            num -= 3;
            break;
    }
}`;

const failingCode = 
`
void foo16_6_2( int num )
{
    int a = 7;
    switch (num % 3) { 
        case 0:
            a *= 2;
            break;
        case 1:
            a += 5;
            break;
        default:
            a -= 3;
            break;
    }
}
    
void foo16_6_3( bool flag )
{
    int a = 7;
    switch (flag) { 
        case 1:
            a *= 2;
            break;
        case 0:
            a += 5;
            break;
        default:
            a -= 3;
            break;
    }
}
`;

const files: TestFile[] = [
    { name: "bad.c", code: failingCode },
    { name: "good.c", code: passingCode }
];

describe("Rule 16.7", () => {
    registerSourceCode(files);

    it("should detect errors in bad.c", () => {
        expect(countMISRAErrors()).toBe(2);
    });

    it("should correct errors in bad.c", () => {
        expect(countErrorsAfterCorrection()).toBe(0);
    });
});
