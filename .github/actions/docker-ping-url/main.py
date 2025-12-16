import os
import time
import requests

def ping_url(url, delay, max_trials):

    for attempt in range(max_trials):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print(f"Success: {url} is reachable.")
                return True
            else:
                print(f"Attempt {attempt + 1}: Received status code {response.status_code}. Retrying in {delay} seconds...")
        except requests.RequestException as e:
            print(f"Attempt {attempt + 1}: Error occurred: {e}. Retrying in {delay} seconds...")
        except requests.exceptions.MissingSchema:
            print(f"Error: The URL '{url}' is invalid. Please provide a valid URL.")
            return False
        
        time.sleep(delay)
    
    print(f"Failed: {url} is not reachable after {max_trials} attempts.")
    return False

def run():
    url = os.getenv("INPUT_URL")
    delay = int(os.getenv("INPUT_DELAY"))
    max_trials = int(os.getenv("INPUT_MAX_TRIALS"))

    website_reachable = ping_url(url, delay, max_trials)

    if not website_reachable:
        raise Exception(f"URL '{url}' is not reachable after {max_trials} attempts.")

if __name__ == "__main__":
    run()