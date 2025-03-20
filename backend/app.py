from flask import request, jsonify
from flask_restful import Api, Resource
from flask_cors import CORS
from resources.models import Usuario, Movimentacao
from resources.config import app, db
from flask_mail import Mail, Message
from itsdangerous import URLSafeTimedSerializer
from werkzeug.security import generate_password_hash, check_password_hash
import traceback

# Configuração do Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'gestaofintcc@gmail.com'
app.config['MAIL_PASSWORD'] = 'fmvq yhmj cjhb ajsu'
app.config['MAIL_DEFAULT_SENDER'] = app.config['MAIL_USERNAME']

mail = Mail(app)
s = URLSafeTimedSerializer(app.config['SECRET_KEY'])

api = Api(app)
CORS(app)

class Home(Resource):
    def get(self):
        return jsonify({"message": "Servidor Flask está rodando!"})

class Registro(Resource):
    def post(self):
        data = request.get_json()
        if Usuario.query.filter_by(email=data['email']).first():
            return {'mensagem': 'Usuário já existe'}, 400

        novo_usuario = Usuario(
            username=data['username'],
            email=data['email'],
            senha=data['senha']
        )
        db.session.add(novo_usuario)
        db.session.commit()
        return {'mensagem': 'Usuário registrado com sucesso'}, 201


class Login(Resource):
    def post(self):
        data = request.get_json()
        usuario = Usuario.query.filter_by(email=data['email']).first()
        if usuario and usuario.verificar_senha(data['senha']):
            return {'mensagem': 'Login bem-sucedido', 'usuario': usuario.username}
        return {'mensagem': 'Credenciais inválidas'}, 401

class MovimentacoesFinanceiras(Resource):
    def get(self, usuario_id):
        movimentacoes = Movimentacao.query.filter_by(usuario_id=usuario_id).all()
        return jsonify([
            {
                "id": mov.id,
                "tipo": mov.tipo,
                "valor": float(mov.valor),
                "data": mov.data_movimentacao.strftime("%Y-%m-%d %H:%M:%S")
            }
            for mov in movimentacoes
        ])

class ListarUsuarios(Resource):
    def get(self):
        usuarios = Usuario.query.all()
        return jsonify([
            {"id": u.id, "username": u.username, "email": u.email} 
            for u in usuarios
        ])

# Rota para solicitação de redefinição de senha
class RequestPasswordReset(Resource):
    def post(self):
        try:
            data = request.get_json()
            email = data.get('email')

            print(f"🔍 Recebendo solicitação para: {email}")

            usuario = Usuario.query.filter_by(email=email).first()
            if not usuario:
                print("❌ Usuário não encontrado!")
                return jsonify({'mensagem': 'Usuário não encontrado'}), 404

            # Gerar o token seguro
            token = s.dumps(email, salt='reset-password')
            reset_url = f"http://localhost:4200/reset-password/{token}"
            print(f"🔑 Token gerado: {token}")

            # Criar e enviar o e-mail
            msg = Message(
                subject='Redefinição de Senha',
                sender=app.config['MAIL_USERNAME'],
                recipients=[email]
            )
            msg.body = f'Clique no link para redefinir sua senha: {reset_url}'

            print("📨 Tentando enviar e-mail...")
            mail.send(msg)
            print("E-mail enviado com sucesso!")

            return jsonify({
                'mensagem': 'E-mail de redefinição enviado com sucesso!',
                'status': 'success',
                'email': email
            })

        except Exception as e:
            print("🔥 Erro ao processar a solicitação:")
            traceback.print_exc()
            return jsonify({
                'mensagem': 'Erro no servidor ao enviar e-mail',
                'erro': str(e),
                'status': 'error'
            }), 500

# Rota para redefinir a senha usando o token
class ResetPassword(Resource):
    def post(self, token):
        try:
            email = s.loads(token, salt='reset-password', max_age=3600)
        except Exception as e:
            print("❌ Erro ao validar token:", e)
            return jsonify({'mensagem': 'Token inválido ou expirado'}), 400

        data = request.get_json()
        nova_senha = data.get('password')

        usuario = Usuario.query.filter_by(email=email).first()
        if not usuario:
            return jsonify({'mensagem': 'Usuário não encontrado'}), 404

        usuario.senha = generate_password_hash(nova_senha)
        db.session.commit()

        return jsonify({'mensagem': 'Senha redefinida com sucesso!'}), 200

# Registrando as rotas na API
api.add_resource(Home, '/')
api.add_resource(Registro, '/registrar')
api.add_resource(Login, '/login')
api.add_resource(MovimentacoesFinanceiras, '/movimentacoes/<int:usuario_id>')
api.add_resource(ListarUsuarios, '/listar')
api.add_resource(RequestPasswordReset, '/request-password-reset')
api.add_resource(ResetPassword, '/reset-password/<token>')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)