---
name: Cerebras Inference
description: Use this to write code to call an LLM using OpenAI.
---

# Calling an LLM via Cerebras

These instructions allow you write code to call an LLM with Cerebras specified as the inference provider.  
This method uses OpenAI.

## Setup

The OPENAI_API_KEY must be set in the .env file and loaded in as an environment variable.  

The uv project must include OpenAI.
`uv add openai`

## Code snippets

Use code like these examples in order to use OpenAI.

### Imports and constants

```python
from litellm import completion
MODEL = "openai/gpt-5.1"
```

### Code to call OpenAI for a text response

```python
response = completion(model=MODEL, messages=messages, reasoning_effort="low")
result = response.choices[0].message.content
```

### Code to call OpenAI for a Structured Outputs response

```python
response = completion(model=MODEL, messages=messages, response_format=MyBaseModelSubclass, reasoning_effort="low")
result = response.choices[0].message.content
result_as_object = MyBaseModelSubclass.model_validate_json(result)
```