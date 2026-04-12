"""
模型加载器 - 从HuggingFace Hub加载模型
无需上传模型文件到HF Space
"""

from transformers import AutoModelForSequenceClassification, AutoTokenizer, AutoModelForSeq2SeqLM
import logging

logger = logging.getLogger(__name__)


class ModelLoader:
    """模型加载器"""
    
    def __init__(self):
        self.classifier_model = None
        self.classifier_tokenizer = None
        self.generator_model = None
        self.generator_tokenizer = None
    
    def load_classifier(self, model_name: str = "hfl/chinese-roberta-wwm-ext"):
        """
        加载分类模型（违规检测）
        
        可选模型：
        - hfl/chinese-roberta-wwm-ext (推荐，中文优化)
        - EnlightenedAI/TCSI_pp_zh (浙大CAPP-130，如果存在)
        - bert-base-chinese
        """
        logger.info(f"正在加载分类模型: {model_name}")
        
        self.classifier_tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.classifier_model = AutoModelForSequenceClassification.from_pretrained(
            model_name,
            num_labels=12,  # 12种违规类型
            ignore_mismatched_sizes=True
        )
        
        logger.info(f"分类模型加载完成: {model_name}")
        return self.classifier_model, self.classifier_tokenizer
    
    def load_generator(self, model_name: str = "google/mt5-small"):
        """
        加载生成模型（整改建议）
        
        可选模型：
        - google/mt5-small (推荐，小而快)
        - google/mt5-base (更大，效果更好)
        - fnlp/bart-base-chinese (中文BART)
        """
        logger.info(f"正在加载生成模型: {model_name}")
        
        self.generator_tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.generator_model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        
        logger.info(f"生成模型加载完成: {model_name}")
        return self.generator_model, self.generator_tokenizer
    
    def load_all(self, classifier_name: str = None, generator_name: str = None):
        """加载所有模型"""
        if classifier_name:
            self.load_classifier(classifier_name)
        if generator_name:
            self.load_generator(generator_name)
        
        return {
            "classifier": (self.classifier_model, self.classifier_tokenizer),
            "generator": (self.generator_model, self.generator_tokenizer)
        }


# 全局模型实例
_model_loader = None


def get_model_loader():
    """获取全局模型加载器"""
    global _model_loader
    if _model_loader is None:
        _model_loader = ModelLoader()
    return _model_loader


# 使用示例
if __name__ == "__main__":
    loader = get_model_loader()
    
    # 加载分类模型
    classifier, tokenizer = loader.load_classifier("hfl/chinese-roberta-wwm-ext")
    print(f"分类模型参数量: {sum(p.numel() for p in classifier.parameters()):,}")
    
    # 加载生成模型
    generator, gen_tokenizer = loader.load_generator("google/mt5-small")
    print(f"生成模型参数量: {sum(p.numel() for p in generator.parameters()):,}")
