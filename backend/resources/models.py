from resources.config import db, bcrypt
import re
from flask import abort
from sqlalchemy import Numeric

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    senha_hash = db.Column(db.String(100), nullable=False)
    nomeCompleto = db.Column(db.String(120))
    dataNascimento = db.Column(db.String(10))
    genero = db.Column(db.String(20))
    cpf = db.Column(db.String(14),unique=True )
    telefone = db.Column(db.String(20))
    endereco = db.Column(db.String(120))
    cidade = db.Column(db.String(50))
    estado = db.Column(db.String(50))
    cep = db.Column(db.String(20))
    rendaMensal = db.Column(Numeric(10, 2))
    objetivo = db.Column(db.String(50))

    @property
    def senha(self):
        raise AttributeError('Senha não pode ser acessada diretamente')

    @senha.setter
    def senha(self, senha_plana):
        if not self._validar_senha(senha_plana):
            abort(400, description="Senha inválida. Ela deve ter ao menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial.")
        self.senha_hash = bcrypt.generate_password_hash(senha_plana).decode('utf-8')

    def verificar_senha(self, senha_plana):
        return bcrypt.check_password_hash(self.senha_hash, senha_plana)

    def _validar_senha(self, senha):
        if len(senha) < 8:
            return False
        if not re.search(r"[A-Z]", senha):
            return False
        if not re.search(r"[a-z]", senha):
            return False
        if not re.search(r"\d", senha):
            return False
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", senha):
            return False
        return True

class Movimentacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    tipo = db.Column(db.Enum('entrada', 'saida'), nullable=False)
    valor = db.Column(db.Numeric(10,2), nullable=False)
    data_movimentacao = db.Column(db.DateTime, default=db.func.current_timestamp())

    usuario = db.relationship('Usuario', backref=db.backref('movimentacoes', lazy=True))


class ContaPagar(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    descricao = db.Column(db.String(120), nullable=False)
    valor = db.Column(db.Numeric(10, 2), nullable=False)
    data = db.Column(db.Date, nullable=False)

    usuario = db.relationship('Usuario', backref=db.backref('contas_pagar', lazy=True))
