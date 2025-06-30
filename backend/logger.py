import logging
import sys
from logging.handlers import TimedRotatingFileHandler

def setup_logger():
    """Sets up a logger that logs to both console and a file."""
    logger = logging.getLogger("stock_screener")
    logger.setLevel(logging.INFO)

    # Prevent propagation to the root logger
    logger.propagate = False

    # Console handler
    if not any(isinstance(h, logging.StreamHandler) for h in logger.handlers):
        console_handler = logging.StreamHandler(sys.stdout)
        console_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

    # File handler (rotates daily)
    if not any(isinstance(h, TimedRotatingFileHandler) for h in logger.handlers):
        file_handler = TimedRotatingFileHandler('app.log', when='midnight', backupCount=7)
        file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    return logger

logger = setup_logger()
