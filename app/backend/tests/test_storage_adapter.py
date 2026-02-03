
import unittest
import os
import sys
from unittest.mock import patch, MagicMock

# We need to make sure we can import from app.backend
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..'))

from app.backend import storage

class TestStorageAdapter(unittest.TestCase):

    def test_file_backend_default(self):
        # By default (or if explicitly set), should use file logic
        # Inspect the module state
        self.assertNotEqual(storage.STORAGE_BACKEND, "convex")

    @patch('app.backend.storage.convex_client')
    def test_convex_backend_delegation(self, mock_convex_client):
        """
        Test that calls are delegated to convex_client when STORAGE_BACKEND is convex.
        Since we can't easily change the module-level STORAGE_BACKEND constant at runtime
        without reload, we will manually trigger the if-condition in a mocked environment
        or just verify that the logic exists.

        A better way to test this without reloading is to inspect the source or
        temporarily set the attribute if possible.
        """
        # Force the adapter to use convex for this test
        # This is hacky but effective for unit testing the logic block
        original_backend = storage.STORAGE_BACKEND
        original_client = storage.convex_client

        try:
            storage.STORAGE_BACKEND = "convex"
            storage.convex_client = mock_convex_client

            # Test create_conversation
            storage.create_conversation("123")
            mock_convex_client.create_conversation.assert_called_with("123")

            # Test get_conversation
            storage.get_conversation("123")
            mock_convex_client.get_conversation.assert_called_with("123")

        finally:
            storage.STORAGE_BACKEND = original_backend
            storage.convex_client = original_client

if __name__ == '__main__':
    unittest.main()
