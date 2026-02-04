import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const extractCustomerDataFromLicense = async (fileBuffer: Buffer, mimeType: string) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY is not set. Returning mock data.');
            return getMockExtraction();
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
            Extract customer and business information from this document. 
            Return the data in the following JSON format:
            {
                "company_name": "string",
                "entity_type": "business" | "individual",
                "trade_license_number": "string",
                "trade_license_authority": "string",
                "trade_license_issue_date": "YYYY-MM-DD",
                "trade_license_expiry_date": "YYYY-MM-DD",
                "trn": "string",
                "incorporation_date": "YYYY-MM-DD",
                "business_activity": "string",
                "first_name": "string (of owner/manager if available)",
                "last_name": "string (of owner/manager if available)",
                "shareholders": [
                    { "name": "string", "nationality": "string", "percentage": number }
                ]
            }
            Only return the JSON object, no other text.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: fileBuffer.toString('base64'),
                    mimeType
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error('Could not parse AI response');
    } catch (error) {
        console.error('AI Extraction Error:', error);
        throw error;
    }
};

const getMockExtraction = () => ({
    company_name: "Mock Tech Solutions LLC",
    entity_type: "business",
    trade_license_number: "CN-1234567",
    trade_license_authority: "DED Dubai",
    trade_license_issue_date: "2023-01-15",
    trade_license_expiry_date: "2024-01-14",
    trn: "100456789000003",
    incorporation_date: "2023-01-15",
    business_activity: "Software Development & IT Consulting",
    shareholders: [
        { name: "John Doe", nationality: "United Kingdom", percentage: 100 }
    ]
});
