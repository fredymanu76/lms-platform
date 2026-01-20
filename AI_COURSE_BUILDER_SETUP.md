# AI Course Builder Setup Guide

## Overview

The AI Course Builder is the headline feature of RR LMS - it allows admins to generate complete, audit-ready compliance training courses in seconds using artificial intelligence.

### What It Generates

- **Complete Course Structure**: Title, description, category, tags
- **Learning Modules**: 2-4 modules per course
- **Lessons with Content**: Multiple lessons per module with rich content blocks (headings, text, callouts, lists)
- **Assessment Quizzes**: 5-10 multiple-choice questions with rationales
- **Regulatory Context**: Compliance-focused content tailored to UK/EMEA financial services

---

## Prerequisites

1. **OpenAI Account**: Sign up at [https://platform.openai.com/signup](https://platform.openai.com/signup)
2. **API Credits**: Ensure you have credits in your OpenAI account
3. **Node.js Project**: This guide assumes you have the RR LMS project set up

---

## Step 1: Get Your OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Give it a name like "RR LMS Course Builder"
4. Copy the API key (starts with `sk-`)
5. **IMPORTANT**: Save this key securely - you won't be able to see it again!

---

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your OpenAI API key to `.env.local`:
   ```env
   # OpenAI (AI Course Builder)
   OPENAI_API_KEY=sk_proj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. Ensure you have your Supabase credentials as well:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## Step 3: Install Dependencies

The OpenAI SDK should already be installed, but verify:

```bash
npm install openai
```

---

## Step 4: Restart Development Server

If your dev server is running, restart it to pick up the new environment variables:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

---

## How to Use the AI Course Builder

### 1. Navigate to Author Studio

1. Log in to your workspace
2. Go to **Author** in the sidebar
3. Click **"Create New Course"**

### 2. Fill in the Course Parameters

The AI needs these inputs to generate a tailored course:

- **Course Title**: e.g., "AML Refresher Training 2026"
- **Topic / Subject Matter**: Describe what the course should cover
  - Example: "Anti-Money Laundering regulations for UK payment services firms, including latest FCA guidance, risk assessment, and customer due diligence"
- **Target Audience**: e.g., "All staff in payment services"
- **Difficulty Level**: Beginner / Intermediate / Advanced
- **Target Duration**: 20-45 minutes recommended for compliance training

### 3. Generate Course

1. Click **"Generate Course with AI"** (purple gradient button)
2. Wait 10-30 seconds for AI to create your course
3. Review the generated outline:
   - Course description
   - Module structure
   - Lesson titles and durations
   - Quiz questions count

### 4. Save as Draft

1. If you're happy with the outline, click **"Save as Draft & Edit"**
2. The course will be created in your database as a draft
3. You'll be redirected to the Author Studio where you can:
   - Edit lesson content
   - Add/remove modules
   - Customize quiz questions
   - Add multimedia content
   - Publish when ready

### 5. Regenerate if Needed

If you're not satisfied with the generated course:
1. Click **"Generate Different Course"**
2. Adjust your inputs
3. Generate again

---

## Example Use Cases

### Example 1: AML Training

**Input:**
- Title: "AML Refresher Training 2026"
- Topic: "Anti-Money Laundering regulations for UK payment services firms, covering risk assessment, customer due diligence, suspicious activity reporting, and record keeping"
- Audience: "All staff in payment services"
- Difficulty: Intermediate
- Duration: 30 minutes

**Output:**
- 3 modules covering: Introduction to AML, Risk Assessment & CDD, Reporting & Compliance
- 8 lessons with practical examples
- 7 quiz questions testing key concepts

### Example 2: Consumer Duty

**Input:**
- Title: "Consumer Duty Implementation"
- Topic: "FCA Consumer Duty requirements for financial services firms, including the four outcomes, fair value, consumer understanding, and support"
- Audience: "Customer-facing staff and compliance officers"
- Difficulty: Intermediate
- Duration: 40 minutes

**Output:**
- 4 modules covering each Consumer Duty outcome
- 10 lessons with regulatory context
- 10 quiz questions with scenarios

### Example 3: Data Protection

**Input:**
- Title: "GDPR Essentials for Fintech"
- Topic: "UK GDPR and Data Protection Act requirements for fintech companies, covering lawful basis, data subject rights, breach notification, and accountability"
- Audience: "All employees"
- Difficulty: Beginner
- Duration: 25 minutes

**Output:**
- 3 modules covering: Principles, Rights, Compliance
- 6 lessons with clear explanations
- 6 quiz questions

---

## Advanced Features

### Lesson Refinement (Coming Soon)

The AI service includes a `refineLesson()` function for improving individual lessons based on feedback:

```typescript
// Example usage (in future updates)
const refinedLesson = await aiCourseGenerator.refineLesson(
  lessonContent,
  "Add more practical examples for payment services firms"
)
```

### Additional Quiz Questions (Coming Soon)

Generate more quiz questions for existing courses:

```typescript
// Example usage (in future updates)
const moreQuestions = await aiCourseGenerator.generateQuizQuestions(
  "AML Risk Assessment",
  5 // number of questions
)
```

---

## Technical Details

### AI Model Used

- **Model**: `gpt-4-turbo-preview`
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Output Format**: Structured JSON matching database schema

### System Prompt

The AI is instructed to act as an expert instructional designer specializing in:
- Regulatory compliance training
- UK/EMEA financial services
- FCA requirements
- Adult learning principles
- Audit-ready content

### Cost Estimation

Average costs per course generation (as of 2025):
- **Input tokens**: ~1,500 tokens (~$0.015)
- **Output tokens**: ~5,000-8,000 tokens (~$0.15-$0.24)
- **Total per course**: ~$0.17-$0.26

For 100 courses/month: ~$17-$26

---

## Troubleshooting

### Error: "Failed to generate course outline"

**Possible causes:**
1. Invalid or expired OpenAI API key
2. No credits remaining in OpenAI account
3. Network connectivity issues
4. OpenAI API downtime

**Solutions:**
1. Verify your API key is correct in `.env.local`
2. Check your OpenAI account has credits: [https://platform.openai.com/usage](https://platform.openai.com/usage)
3. Check API status: [https://status.openai.com/](https://status.openai.com/)
4. Check browser console and server logs for detailed error messages

### Error: "Unauthorized" or "Forbidden"

**Causes:**
1. Not logged in
2. User doesn't have admin/manager role in the organization

**Solution:**
Ensure you're logged in as an owner, admin, or manager of the organization.

### Generated Course Saved but Not Visible

**Causes:**
1. Course saved as draft but not showing in catalogue (drafts are not published)
2. Database connection issues

**Solution:**
1. Check the Author Studio - drafts appear there
2. Publish the course when ready

### API Rate Limits

OpenAI has rate limits based on your account tier:
- **Free tier**: 3 requests/minute
- **Pay-as-you-go**: Higher limits based on usage

If you hit rate limits:
1. Wait a minute and try again
2. Consider upgrading your OpenAI account tier

---

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Rotate API keys** if exposed
3. **Use environment variables** for all secrets
4. **Monitor usage** in OpenAI dashboard to prevent unexpected charges
5. **Set spending limits** in OpenAI account settings

---

## Future Enhancements

Planned features:
- [ ] Course refinement workflow (review → edit → regenerate sections)
- [ ] Custom prompt templates by sector
- [ ] Multi-language course generation
- [ ] Integration with internal knowledge bases
- [ ] Batch course generation
- [ ] AI-powered content updates based on regulatory changes

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs: `npm run dev` output
3. Check browser console for errors
4. Verify environment variables are set correctly
5. Ensure OpenAI API key has sufficient credits

---

## API Reference

### Endpoint: `/api/ai/generate-course`

**Method**: `POST`

**Request Body**:
```json
{
  "orgId": "uuid",
  "title": "string",
  "topic": "string",
  "targetAudience": "string",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "duration": 30,
  "sector": "payment-services",
  "saveAsDraft": false
}
```

**Response (Preview Mode - saveAsDraft: false)**:
```json
{
  "success": true,
  "outline": {
    "title": "string",
    "description": "string",
    "category": "string",
    "tags": ["string"],
    "modules": [...],
    "quiz": {...}
  }
}
```

**Response (Save Mode - saveAsDraft: true)**:
```json
{
  "success": true,
  "message": "Course generated and saved as draft",
  "courseId": "uuid",
  "versionId": "uuid",
  "outline": {...}
}
```

---

Made with 🤖 by RR LMS AI Course Builder
