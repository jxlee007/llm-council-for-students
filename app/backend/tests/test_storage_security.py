import unittest
import os
import shutil
import uuid
from app.backend import storage

class TestStorageSecurity(unittest.TestCase):
    def setUp(self):
        # Use a temporary directory for testing if possible,
        # but since DATA_DIR is imported from config, we might need to mock it or clean up.
        # For now, we will rely on unique IDs and clean up after ourselves.
        self.test_id = str(uuid.uuid4())

    def tearDown(self):
        # Clean up any created file
        path = storage.get_conversation_path(self.test_id)
        if os.path.exists(path):
            os.remove(path)

    def test_valid_conversation_id(self):
        """Test that a valid UUID works correctly."""
        # Should not raise exception
        path = storage.get_conversation_path(self.test_id)
        self.assertTrue(path.endswith(f"{self.test_id}.json"))

        # Test creation
        conv = storage.create_conversation(self.test_id)
        self.assertEqual(conv["id"], self.test_id)

        # Test retrieval
        retrieved = storage.get_conversation(self.test_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved["id"], self.test_id)

    def test_path_traversal_attempt(self):
        """Test that path traversal attempts are blocked."""
        # Attempt to access a file outside the data directory
        malicious_id = "../../etc/passwd"

        # storage.get_conversation should return None (because it catches ValueError)
        # However, checking get_conversation_path directly should raise ValueError
        with self.assertRaises(ValueError):
            storage.get_conversation_path(malicious_id)

        # get_conversation catches the error and returns None
        result = storage.get_conversation(malicious_id)
        self.assertIsNone(result)

    def test_invalid_characters(self):
        """Test that IDs with invalid characters are rejected."""
        invalid_ids = [
            "some/path",
            "some\\path",
            "test.json",
            "user@email.com", # depending on regex, @ might be invalid. Regex is ^[a-zA-Z0-9-]+$
            "id_with_underscore", # underscore not in regex
            " ",
        ]

        for invalid_id in invalid_ids:
            with self.assertRaises(ValueError):
                storage.get_conversation_path(invalid_id)

            self.assertIsNone(storage.get_conversation(invalid_id))

if __name__ == '__main__':
    unittest.main()
